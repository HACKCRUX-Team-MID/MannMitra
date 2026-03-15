import 'package:flutter/material.dart';
import 'package:silent_spiral/core/theme.dart';

/// Passphrase setup dialog for web encryption.
/// On web, flutter_secure_storage is not available, so we derive
/// the encryption key from a user-provided passphrase using PBKDF2.
class PassphraseDialog extends StatefulWidget {
  final bool isSetup; // true = first time setup, false = unlock

  const PassphraseDialog({super.key, this.isSetup = true});

  @override
  State<PassphraseDialog> createState() => _PassphraseDialogState();
}

class _PassphraseDialogState extends State<PassphraseDialog> {
  final _passphraseController = TextEditingController();
  final _confirmController = TextEditingController();
  bool _obscurePassphrase = true;
  bool _obscureConfirm = true;
  String? _error;

  @override
  void dispose() {
    _passphraseController.dispose();
    _confirmController.dispose();
    super.dispose();
  }

  void _submit() {
    final passphrase = _passphraseController.text;
    final confirm = _confirmController.text;

    if (passphrase.length < 8) {
      setState(() => _error = 'Passphrase must be at least 8 characters.');
      return;
    }

    if (widget.isSetup && passphrase != confirm) {
      setState(() => _error = 'Passphrases do not match.');
      return;
    }

    Navigator.of(context).pop(passphrase);
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      backgroundColor: AppTheme.surfaceDarkElevated,
      title: Text(
        widget.isSetup ? '🔐 Set a Private Passphrase' : '🔐 Enter Your Passphrase',
        style: const TextStyle(color: AppTheme.accent, fontSize: 18),
      ),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (widget.isSetup) ...[
              const Text(
                'Your journal will be encrypted with this passphrase. We cannot read your data.',
                style: TextStyle(color: AppTheme.textPrimary, height: 1.5),
              ),
              const SizedBox(height: 8),
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: AppTheme.terracotta.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: AppTheme.terracotta.withValues(alpha: 0.3)),
                ),
                child: const Text(
                  '⚠️ If you forget your passphrase, your entries cannot be recovered.',
                  style: TextStyle(color: AppTheme.terracotta, fontSize: 12, height: 1.4),
                ),
              ),
              const SizedBox(height: 16),
            ] else ...[
              const Text(
                'Enter your passphrase to unlock your journal.',
                style: TextStyle(color: AppTheme.textPrimary, height: 1.5),
              ),
              const SizedBox(height: 16),
            ],
            TextField(
              controller: _passphraseController,
              obscureText: _obscurePassphrase,
              style: const TextStyle(color: AppTheme.textPrimary),
              decoration: InputDecoration(
                labelText: 'Passphrase',
                labelStyle: const TextStyle(color: AppTheme.textSecondary),
                enabledBorder: OutlineInputBorder(
                  borderSide: const BorderSide(color: AppTheme.surfaceDarkBorder),
                  borderRadius: BorderRadius.circular(10),
                ),
                focusedBorder: OutlineInputBorder(
                  borderSide: const BorderSide(color: AppTheme.accent),
                  borderRadius: BorderRadius.circular(10),
                ),
                suffixIcon: IconButton(
                  icon: Icon(
                    _obscurePassphrase ? Icons.visibility_off : Icons.visibility,
                    color: AppTheme.textSecondary,
                    size: 20,
                  ),
                  onPressed: () => setState(() => _obscurePassphrase = !_obscurePassphrase),
                ),
              ),
            ),
            if (widget.isSetup) ...[
              const SizedBox(height: 12),
              TextField(
                controller: _confirmController,
                obscureText: _obscureConfirm,
                style: const TextStyle(color: AppTheme.textPrimary),
                decoration: InputDecoration(
                  labelText: 'Confirm Passphrase',
                  labelStyle: const TextStyle(color: AppTheme.textSecondary),
                  enabledBorder: OutlineInputBorder(
                    borderSide: const BorderSide(color: AppTheme.surfaceDarkBorder),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderSide: const BorderSide(color: AppTheme.accent),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  suffixIcon: IconButton(
                    icon: Icon(
                      _obscureConfirm ? Icons.visibility_off : Icons.visibility,
                      color: AppTheme.textSecondary,
                      size: 20,
                    ),
                    onPressed: () => setState(() => _obscureConfirm = !_obscureConfirm),
                  ),
                ),
              ),
            ],
            if (_error != null) ...[
              const SizedBox(height: 12),
              Text(_error!, style: const TextStyle(color: AppTheme.terracotta, fontSize: 12)),
            ],
          ],
        ),
      ),
      actions: [
        if (!widget.isSetup)
          TextButton(
            onPressed: () => Navigator.of(context).pop(null),
            child: const Text('Cancel', style: TextStyle(color: AppTheme.textSecondary)),
          ),
        ElevatedButton(
          onPressed: _submit,
          style: ElevatedButton.styleFrom(
            backgroundColor: AppTheme.accent,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          ),
          child: Text(widget.isSetup ? 'Set Passphrase' : 'Unlock'),
        ),
      ],
    );
  }
}
