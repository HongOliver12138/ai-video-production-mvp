import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../models/job.dart';
import '../state/app_state.dart';
import '../theme/app_colors.dart';
import '../theme/app_styles.dart';
import '../widgets/status_tag.dart';

/// Timeline screen — dynamic shooting guide driven by the selected job.
class TimelineScreen extends StatelessWidget {
  const TimelineScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final appState = AppStateProvider.of(context);
    final job = appState.selectedJob;

    if (job == null) {
      return ColoredBox(
        color: AppColors.background,
        child: const Center(
          child: Text(
            'Select a job from Matches',
            style: TextStyle(
              fontSize: 16,
              color: AppColors.secondaryText,
            ),
          ),
        ),
      );
    }

    return ColoredBox(
      color: AppColors.background,
      child: SafeArea(
        bottom: false,
        child: ListView(
          padding: const EdgeInsets.fromLTRB(24, 20, 24, 120),
          children: [
            // Title row with phase badge
            Row(
              children: [
                Text(
                  'Your shooting guide',
                  style: GoogleFonts.inter(
                    fontSize: 24,
                    fontWeight: FontWeight.w700,
                    color: AppColors.primaryText,
                  ),
                ),
                const SizedBox(width: 10),
                StatusTag(
                  label: job.phase.label,
                  variant: _variantForPhase(job.phase),
                ),
              ],
            ),
            const SizedBox(height: 4),
            Text(
              _subtitleForPhase(job.phase),
              style: GoogleFonts.inter(
                fontSize: 14,
                color: AppColors.secondaryText,
              ),
            ),
            const SizedBox(height: 24),
            // Timeline card
            Container(
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(28),
                boxShadow: const [AppStyles.premiumShadow],
              ),
              padding: const EdgeInsets.all(24),
              child: Stack(
                children: [
                  // Vertical line connecting all dots
                  Positioned(
                    left: 16,
                    top: 10,
                    bottom: 10,
                    child: Container(width: 2, color: AppColors.background),
                  ),
                  Column(
                    children: _buildTimelineRows(job),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  TagVariant _variantForPhase(JobPhase phase) {
    switch (phase) {
      case JobPhase.awaitingCapture:
        return TagVariant.purple;
      case JobPhase.renderingPreview:
        return TagVariant.yellow;
      case JobPhase.readyForReview:
        return TagVariant.green;
      case JobPhase.approvedForPublish:
      case JobPhase.published:
        return TagVariant.gray;
    }
  }

  String _subtitleForPhase(JobPhase phase) {
    switch (phase) {
      case JobPhase.awaitingCapture:
        return 'Record the clips below, AI handles the rest.';
      case JobPhase.renderingPreview:
        return 'AI is preparing your video preview...';
      case JobPhase.readyForReview:
        return 'All segments ready. Head to Preview to review.';
      case JobPhase.approvedForPublish:
      case JobPhase.published:
        return 'This job is complete.';
    }
  }

  List<Widget> _buildTimelineRows(Job job) {
    final scenes = job.scenes;
    final taskCards = job.taskCards;
    final widgets = <Widget>[];
    double accumulatedSec = 0;

    for (int i = 0; i < scenes.length; i++) {
      if (i > 0) widgets.add(const SizedBox(height: 20));

      final scene = scenes[i];
      final startSec = accumulatedSec;
      final endSec = startSec + scene.durationSec;
      accumulatedSec = endSec;

      final timeRange =
          '${_formatTime(startSec)} - ${_formatTime(endSec)}';

      if (scene.isCaptureScene) {
        // Find matching capture task card by segmentId
        final card = taskCards.cast<CaptureTaskCard?>().firstWhere(
          (c) => c!.segmentId == scene.segmentId,
          orElse: () => null,
        );

        final isActive = job.phase == JobPhase.awaitingCapture;

        widgets.add(
          _TimelineRow(
            timeRange: timeRange,
            tag: 'YOUR TURN',
            tagBg: AppColors.accent,
            tagFg: Colors.white,
            description: card?.exactAction ?? scene.purpose,
            isActive: isActive,
            actionLabel:
                isActive && card != null
                    ? 'Record ${card.durationLimitSeconds}s clip'
                    : null,
            framingInstruction: isActive ? card?.framingInstruction : null,
          ),
        );
      } else {
        // AI-generated scene
        widgets.add(
          _TimelineRow(
            timeRange: timeRange,
            tag: 'AI GEN',
            tagBg: const Color(0xFFE5E7EB),
            tagFg: AppColors.secondaryText,
            description:
                '${scene.purpose} \u2014 ${scene.visualType.replaceAll('_', ' ')}',
            isActive: false,
          ),
        );
      }
    }

    return widgets;
  }

  String _formatTime(double totalSeconds) {
    final secs = totalSeconds.round();
    final minutes = secs ~/ 60;
    final seconds = secs % 60;
    return '$minutes:${seconds.toString().padLeft(2, '0')}';
  }
}

// ────────────────────────────────────────────────────────────────
// _TimelineRow — dot + content card (same visual structure)
// ────────────────────────────────────────────────────────────────

class _TimelineRow extends StatelessWidget {
  const _TimelineRow({
    required this.timeRange,
    required this.tag,
    required this.tagBg,
    required this.tagFg,
    required this.description,
    required this.isActive,
    this.actionLabel,
    this.framingInstruction,
  });

  final String timeRange;
  final String tag;
  final Color tagBg;
  final Color tagFg;
  final String description;
  final bool isActive;
  final String? actionLabel;
  final String? framingInstruction;

  @override
  Widget build(BuildContext context) {
    return Opacity(
      opacity: isActive ? 1.0 : 0.5,
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Dot
          _buildDot(),
          const SizedBox(width: 16),
          // Content card
          Expanded(child: _buildContent()),
        ],
      ),
    );
  }

  Widget _buildDot() {
    if (isActive) {
      return Container(
        width: 36,
        height: 36,
        decoration: BoxDecoration(
          color: const Color(0xFFF3E8FF),
          shape: BoxShape.circle,
          border: Border.all(color: Colors.white, width: 3),
          boxShadow: [
            BoxShadow(
              color: AppColors.accent.withOpacity(0.15),
              blurRadius: 0,
              spreadRadius: 3,
            ),
          ],
        ),
        child: Center(
          child: Container(
            width: 10,
            height: 10,
            decoration: const BoxDecoration(
              color: AppColors.accent,
              shape: BoxShape.circle,
            ),
          ),
        ),
      );
    }
    return Container(
      width: 36,
      height: 36,
      decoration: BoxDecoration(
        color: AppColors.background,
        shape: BoxShape.circle,
        border: Border.all(color: Colors.white, width: 3),
      ),
      child: const Center(
        child: Text('\u2728', style: TextStyle(fontSize: 12)),
      ),
    );
  }

  Widget _buildContent() {
    final borderColor =
        isActive ? const Color(0xFFA855F7) : AppColors.background;
    final bgColor = isActive ? Colors.white : const Color(0xFFF9FAFB);

    return Container(
      padding: EdgeInsets.all(isActive ? 16 : 12),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: borderColor, width: isActive ? 1.5 : 1),
        boxShadow: isActive
            ? [
                BoxShadow(
                  color: Colors.black.withOpacity(0.04),
                  blurRadius: 8,
                  offset: const Offset(0, 2),
                ),
              ]
            : null,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header: time + tag
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                timeRange,
                style: GoogleFonts.inter(
                  fontSize: 11,
                  fontWeight: isActive ? FontWeight.w700 : FontWeight.w600,
                  color: isActive ? AppColors.accent : const Color(0xFF9CA3AF),
                ),
              ),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: tagBg,
                  borderRadius: BorderRadius.circular(100),
                ),
                child: Text(
                  tag.toUpperCase(),
                  style: GoogleFonts.inter(
                    fontSize: 9,
                    fontWeight: FontWeight.w700,
                    color: tagFg,
                    letterSpacing: 0.8,
                  ),
                ),
              ),
            ],
          ),
          SizedBox(height: isActive ? 8 : 6),
          Text(
            description,
            style: GoogleFonts.inter(
              fontSize: isActive ? 15 : 13,
              fontWeight: isActive ? FontWeight.w600 : FontWeight.w500,
              color: isActive ? AppColors.primaryText : AppColors.grayText,
            ),
          ),
          if (actionLabel != null) ...[
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              child: TextButton(
                onPressed: () {},
                style: TextButton.styleFrom(
                  backgroundColor: AppColors.buttonPrimary,
                  padding: const EdgeInsets.symmetric(vertical: 10),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(100),
                  ),
                ),
                child: Text(
                  actionLabel!,
                  style: GoogleFonts.inter(
                    fontSize: 13,
                    fontWeight: FontWeight.w500,
                    color: Colors.white,
                  ),
                ),
              ),
            ),
          ],
          if (framingInstruction != null &&
              framingInstruction!.isNotEmpty) ...[
            const SizedBox(height: 8),
            Text(
              framingInstruction!,
              style: GoogleFonts.inter(
                fontSize: 12,
                fontStyle: FontStyle.italic,
                color: AppColors.secondaryText,
              ),
            ),
          ],
        ],
      ),
    );
  }
}
