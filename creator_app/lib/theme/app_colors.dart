import 'dart:ui';

import 'package:flutter/material.dart';

abstract final class AppColors {
  // Core palette (from APP_SPEC.md §2)
  static const background = Color(0xFFF3F4F6);
  static const surface = Colors.white;
  static const primaryText = Color(0xFF111827);
  static const secondaryText = Color(0xFF6B7280);
  static const accent = Color(0xFF9333EA);
  static const success = Color(0xFF059669);

  // Button states (extracted from components-step1.html)
  static const buttonPrimary = Color(0xFF111827);
  static const buttonDisabledBg = Color(0xFFE5E7EB);
  static const buttonDisabledText = Color(0xFF9CA3AF);
  static const ghostText = Color(0xFF6B7280);

  // Status tag backgrounds (Tailwind *-100 equivalents)
  static const purpleBg = Color(0xFFF3E8FF);
  static const purpleText = Color(0xFF7C3AED);
  static const grayBg = Color(0xFFF3F4F6);
  static const grayText = Color(0xFF4B5563);
  static const yellowBg = Color(0xFFFEF3C7);
  static const yellowText = Color(0xFFB45309);
  static const greenBg = Color(0xFFD1FAE5);
  static const greenText = Color(0xFF047857);
}
