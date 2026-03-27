import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../models/job.dart';
import '../state/app_state.dart';
import '../theme/app_colors.dart';
import '../widgets/primary_button.dart';

/// Publish / Review screen — phase-aware display.
/// Shows different UI depending on the selected job's current phase.
class PublishScreen extends StatelessWidget {
  const PublishScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final appState = AppStateProvider.of(context);
    final job = appState.selectedJob;

    if (job == null) {
      return const ColoredBox(
        color: AppColors.surface,
        child: Center(
          child: Text(
            'Select a job first',
            style: TextStyle(
              fontSize: 16,
              color: AppColors.secondaryText,
            ),
          ),
        ),
      );
    }

    switch (job.phase) {
      case JobPhase.awaitingCapture:
        return _AwaitingCaptureView(job: job);
      case JobPhase.renderingPreview:
        return const _RenderingPreviewView();
      case JobPhase.readyForReview:
        return _ReadyForReviewView(job: job);
      case JobPhase.approvedForPublish:
        return const _ApprovedForPublishView();
      case JobPhase.published:
        return const _PublishedView();
    }
  }
}

// ============================================================
// awaitingCapture
// ============================================================

class _AwaitingCaptureView extends StatelessWidget {
  const _AwaitingCaptureView({required this.job});

  final Job job;

  @override
  Widget build(BuildContext context) {
    final totalTasks = job.status.captureProgress.totalTasks;
    final completedTasks = job.status.captureProgress.completedTasks;
    final ratio = totalTasks > 0 ? completedTasks / totalTasks : 0.0;

    return ColoredBox(
      color: AppColors.surface,
      child: SafeArea(
        bottom: false,
        child: ListView(
          padding: const EdgeInsets.fromLTRB(24, 20, 24, 24),
          children: [
            Text(
              'Complete your tasks first',
              style: GoogleFonts.inter(
                fontSize: 24,
                fontWeight: FontWeight.w700,
                color: AppColors.primaryText,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              'Record all clips before AI can prepare your draft.',
              style: GoogleFonts.inter(
                fontSize: 14,
                color: AppColors.secondaryText,
              ),
            ),
            const SizedBox(height: 32),
            Text(
              '$completedTasks/$totalTasks capture tasks done',
              style: GoogleFonts.inter(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: AppColors.primaryText,
              ),
            ),
            const SizedBox(height: 12),
            ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: LinearProgressIndicator(
                value: ratio,
                minHeight: 8,
                backgroundColor: AppColors.background,
                valueColor:
                    const AlwaysStoppedAnimation<Color>(AppColors.accent),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ============================================================
// renderingPreview
// ============================================================

class _RenderingPreviewView extends StatelessWidget {
  const _RenderingPreviewView();

  @override
  Widget build(BuildContext context) {
    return ColoredBox(
      color: AppColors.surface,
      child: SafeArea(
        bottom: false,
        child: Center(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  'AI is preparing your video...',
                  style: GoogleFonts.inter(
                    fontSize: 24,
                    fontWeight: FontWeight.w700,
                    color: AppColors.primaryText,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 4),
                Text(
                  'This usually takes a few minutes.',
                  style: GoogleFonts.inter(
                    fontSize: 14,
                    color: AppColors.secondaryText,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 32),
                const CircularProgressIndicator(
                  color: AppColors.accent,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

// ============================================================
// readyForReview
// ============================================================

class _ReadyForReviewView extends StatelessWidget {
  const _ReadyForReviewView({required this.job});

  final Job job;

  @override
  Widget build(BuildContext context) {
    final appState = AppStateProvider.of(context);

    return ColoredBox(
      color: AppColors.surface,
      child: SafeArea(
        bottom: false,
        child: Column(
          children: [
            // Scrollable content
            Expanded(
              child: ListView(
                padding: const EdgeInsets.fromLTRB(24, 20, 24, 24),
                children: [
                  Text(
                    'Ready for review',
                    style: GoogleFonts.inter(
                      fontSize: 24,
                      fontWeight: FontWeight.w700,
                      color: AppColors.primaryText,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'AI prepared this draft based on your materials.',
                    style: GoogleFonts.inter(
                      fontSize: 14,
                      color: AppColors.secondaryText,
                    ),
                  ),
                  const SizedBox(height: 24),
                  // 9:16 video preview
                  AspectRatio(
                    aspectRatio: 9 / 16,
                    child: Container(
                      decoration: BoxDecoration(
                        color: const Color(0xFFF3F4F6),
                        borderRadius: BorderRadius.circular(24),
                        border: Border.all(color: const Color(0xFFE5E7EB)),
                      ),
                      clipBehavior: Clip.antiAlias,
                      child: Stack(
                        alignment: Alignment.center,
                        children: [
                          // Play button
                          Container(
                            width: 56,
                            height: 56,
                            decoration: BoxDecoration(
                              color: Colors.white.withOpacity(0.8),
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(
                              Icons.play_arrow_rounded,
                              size: 28,
                              color: AppColors.primaryText,
                            ),
                          ),
                          // Bottom overlay
                          Positioned(
                            left: 16,
                            right: 16,
                            bottom: 16,
                            child: Container(
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: Colors.white.withOpacity(0.9),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Row(
                                children: [
                                  // Gradient avatar
                                  Container(
                                    width: 32,
                                    height: 32,
                                    decoration: const BoxDecoration(
                                      shape: BoxShape.circle,
                                      gradient: LinearGradient(
                                        begin: Alignment.topLeft,
                                        end: Alignment.bottomRight,
                                        colors: [
                                          Color(0xFFA78BFA),
                                          Color(0xFFEC4899),
                                        ],
                                      ),
                                    ),
                                  ),
                                  const SizedBox(width: 12),
                                  Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        '${job.totalDurationSec.toStringAsFixed(0)}s TikTok Clip',
                                        style: GoogleFonts.inter(
                                          fontSize: 12,
                                          fontWeight: FontWeight.w700,
                                          color: AppColors.primaryText,
                                        ),
                                      ),
                                      Text(
                                        job.jobId,
                                        style: GoogleFonts.inter(
                                          fontSize: 10,
                                          color: AppColors.secondaryText,
                                        ),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
            // Bottom action area
            Container(
              padding: const EdgeInsets.fromLTRB(24, 16, 24, 40),
              decoration: const BoxDecoration(
                color: AppColors.surface,
                border: Border(top: BorderSide(color: Color(0xFFF3F4F6))),
              ),
              child: Column(
                children: [
                  PrimaryButton(
                    label: 'Approve & Submit',
                    onPressed: () {
                      appState
                          .updateJobPhase(JobPhase.approvedForPublish);
                    },
                  ),
                  const SizedBox(height: 8),
                  TextButton(
                    onPressed: () {
                      // No-op for MVP
                    },
                    child: Text(
                      'Needs tweaks',
                      style: GoogleFonts.inter(
                        fontSize: 14,
                        fontWeight: FontWeight.w500,
                        color: const Color(0xFF9CA3AF),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ============================================================
// approvedForPublish
// ============================================================

class _ApprovedForPublishView extends StatelessWidget {
  const _ApprovedForPublishView();

  @override
  Widget build(BuildContext context) {
    return ColoredBox(
      color: AppColors.surface,
      child: SafeArea(
        bottom: false,
        child: Center(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  'Submitting to platform...',
                  style: GoogleFonts.inter(
                    fontSize: 24,
                    fontWeight: FontWeight.w700,
                    color: AppColors.primaryText,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 4),
                Text(
                  'Your video is being uploaded.',
                  style: GoogleFonts.inter(
                    fontSize: 14,
                    color: AppColors.secondaryText,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 32),
                const CircularProgressIndicator(
                  color: AppColors.accent,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

// ============================================================
// published
// ============================================================

class _PublishedView extends StatelessWidget {
  const _PublishedView();

  @override
  Widget build(BuildContext context) {
    return ColoredBox(
      color: AppColors.surface,
      child: SafeArea(
        bottom: false,
        child: Center(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(
                  Icons.check_circle_rounded,
                  size: 80,
                  color: AppColors.success,
                ),
                const SizedBox(height: 24),
                Text(
                  'Your video is live!',
                  style: GoogleFonts.inter(
                    fontSize: 24,
                    fontWeight: FontWeight.w700,
                    color: AppColors.primaryText,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 4),
                Text(
                  'Great work. Your content is now published.',
                  style: GoogleFonts.inter(
                    fontSize: 14,
                    color: AppColors.secondaryText,
                  ),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
