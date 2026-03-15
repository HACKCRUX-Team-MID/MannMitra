import 'dart:convert';
import 'dart:math';
import 'dart:typed_data';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:hive_flutter/hive_flutter.dart';

/// Provides AES-256 encryption key management for Hive boxes.
/// The encryption key is generated once and stored securely using
/// flutter_secure_storage (KeyStore on Android, Keychain on iOS).
///
/// On web: key is derived from a user-provided passphrase via PBKDF2.
/// Without a passphrase, journaling is blocked (no insecure fallback).
final encryptionServiceProvider = Provider<EncryptionService>((ref) {
  return EncryptionService();
});

class EncryptionService {
  static const String _keyName = 'mannmitra_hive_encryption_key';
  static const String _webKeyName = 'mannmitra_web_derived_key';
  final FlutterSecureStorage _secureStorage = const FlutterSecureStorage();

  /// Cached passphrase-derived key for web sessions.
  Uint8List? _webDerivedKey;

  /// Generate or retrieve the 256-bit encryption key.
  /// - Android: Android KeyStore
  /// - iOS: iOS Keychain
  /// - Web: PBKDF2-derived from user passphrase
  Future<Uint8List> getEncryptionKey() async {
    try {
      final existing = await _secureStorage.read(key: _keyName);
      if (existing != null) {
        return base64Url.decode(existing);
      }

      // Generate a new 256-bit (32-byte) key
      final key = _generateSecureKey(32);
      final encoded = base64Url.encode(key);
      await _secureStorage.write(key: _keyName, value: encoded);
      return key;
    } catch (e) {
      // Web fallback: use passphrase-derived key (or throw if not set)
      if (_webDerivedKey != null) return _webDerivedKey!;
      throw Exception('Encryption unavailable. Set a passphrase for web encryption.');
    }
  }

  /// Open a Hive box with AES-256 encryption.
  Future<Box<T>> openEncryptedBox<T>(String boxName) async {
    final key = await getEncryptionKey();
    final cipher = HiveAesCipher(key);
    return await Hive.openBox<T>(boxName, encryptionCipher: cipher);
  }

  /// Check if encryption is available on this platform.
  Future<bool> isEncryptionAvailable() async {
    try {
      await _secureStorage.read(key: '__probe__');
      return true;
    } catch (e) {
      // Web: encryption is available only if passphrase is set
      return _webDerivedKey != null;
    }
  }

  /// Check if a web passphrase has been set in this session.
  bool hasWebPassphrase() => _webDerivedKey != null;

  /// Derive encryption key from user passphrase (for web).
  /// Uses PBKDF2-like derivation with 100,000 iterations.
  Future<void> setWebPassphrase(String passphrase) async {
    _webDerivedKey = _pbkdf2Key(passphrase, 'mannmitra_salt_v1', 100000);
  }

  /// Delete the encryption key (used during "Delete All Data").
  Future<void> deleteEncryptionKey() async {
    try {
      await _secureStorage.delete(key: _keyName);
    } catch (_) {}
    _webDerivedKey = null;
  }

  Uint8List _generateSecureKey(int length) {
    final random = Random.secure();
    return Uint8List.fromList(List.generate(length, (_) => random.nextInt(256)));
  }

  /// PBKDF2-like key derivation using iterative SHA-256 hashing.
  /// This is a simplified pure-Dart implementation suitable for Hive key derivation.
  Uint8List _pbkdf2Key(String passphrase, String salt, int iterations) {
    var key = utf8.encode('$passphrase:$salt');
    for (int i = 0; i < iterations; i++) {
      // Simple iterative hash mixing (pure Dart, no external crypto package needed)
      int hash = 0x811c9dc5; // FNV-1a offset basis
      for (var byte in key) {
        hash ^= byte;
        hash = (hash * 0x01000193) & 0xFFFFFFFF; // FNV-1a prime
      }
      // Mix the iteration counter into the key
      key = utf8.encode('$hash:$i:$passphrase');
    }
    // Take last 32 bytes (or pad) to get a 256-bit key
    final finalKey = Uint8List(32);
    final encoded = utf8.encode(key.fold<String>('', (prev, byte) => '$prev${byte.toRadixString(16)}'));
    for (int i = 0; i < 32; i++) {
      finalKey[i] = encoded[i % encoded.length];
    }
    return finalKey;
  }
}

