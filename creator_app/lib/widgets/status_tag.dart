import 'package:flutter/material.dart';

import '../theme/app_colors.dart';
import '../theme/app_styles.dart';

enum TagVariant { purple, gray, yellow, green }

class StatusTag extends StatelessWidget {
  const StatusTag({
    super.key,
    required this.label,
    this.variant = TagVariant.gray,
  });

  final String label;
  final TagVariant variant;

  @override
  Widget build(BuildContext context) {
    final (bg, fg) = switch (variant) {
      TagVariant.purple => (AppColors.purpleBg, AppColors.purpleText),
      TagVariant.gray   => (AppColors.grayBg, AppColors.grayText),
      TagVariant.yellow => (AppColors.yellowBg, AppColors.yellowText),
      TagVariant.green  => (AppColors.greenBg, AppColors.greenText),
    };

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(100), // rounded-full
      ),
      child: Text(
        label.toUpperCase(),
        style: AppStyles.statusTag.copyWith(color: fg),
      ),
    );
  }
}
