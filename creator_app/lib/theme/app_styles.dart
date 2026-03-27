import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import 'app_colors.dart';

abstract final class AppStyles {
  // Button text — matches HTML: font-bold text-lg (18px)
  static TextStyle buttonPrimary = GoogleFonts.inter(
    fontSize: 18,
    fontWeight: FontWeight.w700,
    color: Colors.white,
  );

  static TextStyle buttonDisabled = GoogleFonts.inter(
    fontSize: 18,
    fontWeight: FontWeight.w700,
    color: AppColors.buttonDisabledText,
  );

  // Ghost / secondary — font-medium text-sm (14px)
  static TextStyle ghost = GoogleFonts.inter(
    fontSize: 14,
    fontWeight: FontWeight.w500,
    color: AppColors.ghostText,
  );

  // Status tag — text-[10px] font-bold uppercase tracking-wider
  static TextStyle statusTag = GoogleFonts.inter(
    fontSize: 10,
    fontWeight: FontWeight.w700,
    letterSpacing: 1.2,
  );

  // Premium shadow (APP_SPEC.md §2)
  static const premiumShadow = BoxShadow(
    color: Color(0x0A000000), // black @ 4%
    blurRadius: 24,
    offset: Offset(0, 4),
  );
}
