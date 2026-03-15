import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppTheme {
  // ── Lavender Aurora Palette ──
  static const Color accent = Color(0xFFB388FF);         // Vibrant Lavender
  static const Color accentSoft = Color(0xFF9C7CF4);     // Muted Lavender
  static const Color terracotta = Color(0xFFFF8A80);     // Soft Coral-Red
  static const Color warmGold = Color(0xFFFFD54F);       // Warm Gold accent
  static const Color deepOceanBlue = Color(0xFF5C6BC0);  // Indigo accent
  static const Color cyan = Color(0xFF80DEEA);           // Soft Cyan

  static const Color backgroundDark = Color(0xFF0A0A12);  // Near-black with blue tint
  static const Color surfaceDark = Color(0xFF12121C);
  static const Color surfaceDarkElevated = Color(0xFF1A1A2E);
  static const Color surfaceDarkBorder = Color(0xFF2A2A40);

  static const Color textPrimary = Color(0xFFF0E6FF);    // Warm white with lavender tint
  static const Color textSecondary = Color(0xFF9E9EB8);

  // Legacy aliases so existing code doesn't break
  static const Color sageGreen = accent;

  static ThemeData get darkTheme {
    return ThemeData(
      brightness: Brightness.dark,
      scaffoldBackgroundColor: backgroundDark,
      primaryColor: accent,
      colorScheme: const ColorScheme.dark(
        primary: accent,
        secondary: deepOceanBlue,
        surfaceContainerHighest: surfaceDarkElevated,
        surface: surfaceDark,
        error: terracotta,
        onPrimary: backgroundDark,
        onSecondary: textPrimary,
        onSurface: textPrimary,
        onError: textPrimary,
      ),
      textTheme: GoogleFonts.outfitTextTheme(ThemeData.dark().textTheme).copyWith(
        displayLarge: GoogleFonts.outfit(color: textPrimary, fontWeight: FontWeight.w700, height: 1.2),
        displayMedium: GoogleFonts.outfit(color: textPrimary, fontWeight: FontWeight.w600, height: 1.2),
        titleLarge: GoogleFonts.outfit(color: textPrimary, fontWeight: FontWeight.w600, height: 1.3),
        bodyLarge: GoogleFonts.outfit(color: textPrimary, fontSize: 16, height: 1.6),
        bodyMedium: GoogleFonts.outfit(color: textSecondary, fontSize: 14, height: 1.5),
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: backgroundDark,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        centerTitle: true,
      ),
      cardTheme: CardThemeData(
        color: surfaceDark,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        elevation: 0,
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: surfaceDarkElevated,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(20),
          borderSide: BorderSide.none,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(20),
          borderSide: BorderSide.none,
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(20),
          borderSide: const BorderSide(color: accent, width: 1.5),
        ),
        hintStyle: GoogleFonts.outfit(color: textSecondary),
        contentPadding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
      ),
    );
  }
}
