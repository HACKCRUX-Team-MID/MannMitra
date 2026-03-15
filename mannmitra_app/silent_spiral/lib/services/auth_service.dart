import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:firebase_auth/firebase_auth.dart';

final authServiceProvider = Provider<AuthService>((ref) {
  return AuthService();
});

class AuthService {
  FirebaseAuth? get _auth {
    try {
      return FirebaseAuth.instance;
    } catch (_) {
      return null;
    }
  }

  Future<UserCredential?> signInAnonymously() async {
    try {
       return await _auth?.signInAnonymously();
    } catch (e) {
       print("Auth error: $e");
       return null;
    }
  }

  User? get currentUser {
    try {
       return _auth?.currentUser;
    } catch (_) {
       return null;
    }
  }
}
