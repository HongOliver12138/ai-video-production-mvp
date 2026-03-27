import 'package:flutter/material.dart';

import '../theme/app_colors.dart';
import '../theme/app_styles.dart';

class PrimaryButton extends StatelessWidget {
  const PrimaryButton({
    super.key,
    required this.label,
    this.onPressed,
  });

  final String label;
  final VoidCallback? onPressed;

  bool get _enabled => onPressed != null;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      height: 56,
      child: TextButton(
        onPressed: onPressed,
        style: TextButton.styleFrom(
          backgroundColor:
              _enabled ? AppColors.buttonPrimary : AppColors.buttonDisabledBg,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
          padding: const EdgeInsets.symmetric(vertical: 16),
          splashFactory: _enabled ? null : NoSplash.splashFactory,
        ),
        child: Text(
          label,
          style: _enabled
              ? AppStyles.buttonPrimary
              : AppStyles.buttonDisabled,
        ),
      ),
    );
  }
}
