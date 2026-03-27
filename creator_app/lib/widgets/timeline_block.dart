import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../theme/app_colors.dart';
import '../theme/app_styles.dart';

/// A single step in the vertical timeline.
class TimelineStep {
  const TimelineStep({
    required this.label,
    required this.body,
    this.tag,
    this.tagVariant = _TagVariant.gray,
    this.isActive = false,
    this.isCompleted = false,
  });

  final String label;
  final Widget body;
  final String? tag;
  final _TagVariant tagVariant;
  final bool isActive;
  final bool isCompleted;
}

enum _TagVariant { gray, purple, green }

/// Vertical timeline UI extracted from the "Adapted Lines" block
/// in components-step2.html. Each step has a numbered dot, a
/// connecting line, a section label, and a content body.
class TimelineBlock extends StatelessWidget {
  const TimelineBlock({super.key, required this.steps});

  final List<TimelineStep> steps;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        for (int i = 0; i < steps.length; i++) _buildStep(i),
      ],
    );
  }

  Widget _buildStep(int index) {
    final step = steps[index];
    final isLast = index == steps.length - 1;

    // Dot color based on state
    final dotColor = step.isCompleted
        ? AppColors.success
        : step.isActive
            ? AppColors.accent
            : AppColors.buttonDisabledBg;

    final dotTextColor = (step.isCompleted || step.isActive)
        ? Colors.white
        : AppColors.secondaryText;

    // Line color
    final lineColor =
        step.isCompleted ? AppColors.success : const Color(0xFFE5E7EB);

    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Left rail: dot + line
          SizedBox(
            width: 32,
            child: Column(
              children: [
                // Numbered dot
                Container(
                  width: 28,
                  height: 28,
                  decoration: BoxDecoration(
                    color: dotColor,
                    shape: BoxShape.circle,
                  ),
                  alignment: Alignment.center,
                  child: Text(
                    '${index + 1}',
                    style: GoogleFonts.inter(
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                      color: dotTextColor,
                    ),
                  ),
                ),
                // Connecting line
                if (!isLast)
                  Expanded(
                    child: Container(
                      width: 2,
                      margin: const EdgeInsets.symmetric(vertical: 4),
                      color: lineColor,
                    ),
                  ),
              ],
            ),
          ),
          const SizedBox(width: 12),
          // Right content
          Expanded(
            child: Padding(
              padding: EdgeInsets.only(bottom: isLast ? 0 : 24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Header row: label + optional tag
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          step.label.toUpperCase(),
                          style: GoogleFonts.inter(
                            fontSize: 12,
                            fontWeight: FontWeight.w700,
                            color: AppColors.secondaryText,
                            letterSpacing: 1.0,
                          ),
                        ),
                      ),
                      if (step.tag != null) _buildTag(step),
                    ],
                  ),
                  const SizedBox(height: 10),
                  // Body content — wrapped in the purple/white card style
                  // when active, plain container otherwise
                  step.isActive ? _activeBody(step.body) : step.body,
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  /// Purple gradient container matching the "Adapted Lines" block:
  /// bg-purple-50, border-purple-100, rounded-2xl, gradient corner accent.
  Widget _activeBody(Widget child) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: const Color(0xFFFAF5FF), // purple-50
        border: Border.all(color: AppColors.purpleBg),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Stack(
        children: [
          // Gradient corner accent
          Positioned(
            top: -20,
            right: -20,
            child: Container(
              width: 64,
              height: 64,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topRight,
                  end: Alignment.bottomLeft,
                  colors: [
                    AppColors.accent.withOpacity(0.15),
                    Colors.transparent,
                  ],
                ),
                borderRadius: const BorderRadius.only(
                  bottomLeft: Radius.circular(24),
                ),
              ),
            ),
          ),
          child,
        ],
      ),
    );
  }

  Widget _buildTag(TimelineStep step) {
    final (bg, fg) = switch (step.tagVariant) {
      _TagVariant.purple => (AppColors.purpleBg, AppColors.purpleText),
      _TagVariant.green  => (AppColors.greenBg, AppColors.greenText),
      _TagVariant.gray   => (AppColors.grayBg, AppColors.grayText),
    };

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(4),
      ),
      child: Text(
        step.tag!,
        style: GoogleFonts.inter(
          fontSize: 10,
          fontWeight: FontWeight.w700,
          color: fg,
        ),
      ),
    );
  }
}

/// Convenience widget for the white quote card inside an active timeline step.
/// Matches: bg-white rounded-xl p-4 shadow-sm border-purple-100/50.
class TimelineQuoteCard extends StatelessWidget {
  const TimelineQuoteCard({super.key, required this.text});

  final String text;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.purpleBg.withOpacity(0.5)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Text(
        text,
        style: GoogleFonts.inter(
          fontSize: 18,
          fontWeight: FontWeight.w700,
          color: AppColors.primaryText,
          height: 1.3,
        ),
      ),
    );
  }
}
