import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../models/job.dart';
import '../state/app_state.dart';
import '../theme/app_colors.dart';
import '../theme/app_styles.dart';
import '../widgets/status_tag.dart';

class MatchesScreen extends StatelessWidget {
  const MatchesScreen({super.key, this.onJobAccepted});

  /// Called after a job is selected so the parent MainLayout can switch tabs.
  final VoidCallback? onJobAccepted;

  @override
  Widget build(BuildContext context) {
    final appState = AppStateProvider.of(context);
    final jobs = appState.jobs;

    return ColoredBox(
      color: AppColors.background,
      child: SafeArea(
        bottom: false,
        child: CustomScrollView(
          slivers: [
            // Custom top bar — no Scaffold AppBar
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(24, 20, 24, 4),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Your Matches',
                          style: GoogleFonts.inter(
                            fontSize: 28,
                            fontWeight: FontWeight.w600,
                            color: AppColors.primaryText,
                            letterSpacing: -0.5,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Pre-approved opportunities, just for you.',
                          style: GoogleFonts.inter(
                            fontSize: 14,
                            color: AppColors.secondaryText,
                          ),
                        ),
                      ],
                    ),
                    // Settings icon
                    Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        color: AppColors.surface,
                        shape: BoxShape.circle,
                        boxShadow: const [AppStyles.premiumShadow],
                      ),
                      child: const Icon(
                        Icons.tune_rounded,
                        size: 20,
                        color: AppColors.primaryText,
                      ),
                    ),
                  ],
                ),
              ),
            ),
            // Card list or empty state
            if (jobs.isEmpty)
              SliverFillRemaining(
                hasScrollBody: false,
                child: Center(
                  child: Text(
                    'No jobs available',
                    style: GoogleFonts.inter(
                      fontSize: 16,
                      color: AppColors.secondaryText,
                    ),
                  ),
                ),
              )
            else
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(20, 20, 20, 120),
                sliver: SliverList.separated(
                  itemCount: jobs.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 16),
                  itemBuilder: (context, index) {
                    return _JobCard(
                      job: jobs[index],
                      onJobAccepted: onJobAccepted,
                    );
                  },
                ),
              ),
          ],
        ),
      ),
    );
  }
}

/// Job card driven by real [Job] data.
class _JobCard extends StatelessWidget {
  const _JobCard({required this.job, this.onJobAccepted});

  final Job job;
  final VoidCallback? onJobAccepted;

  @override
  Widget build(BuildContext context) {
    final meta = job.meta;
    final phase = job.phase;

    return Container(
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(24),
        boxShadow: const [AppStyles.premiumShadow],
      ),
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Top row: production pattern category + status tag
          Row(
            children: [
              Icon(
                Icons.favorite_border_rounded,
                size: 14,
                color: const Color(0xFFF472B6),
              ),
              const SizedBox(width: 6),
              Expanded(
                child: Text(
                  meta.selectedProductionPattern.toUpperCase(),
                  style: GoogleFonts.inter(
                    fontSize: 10,
                    fontWeight: FontWeight.w600,
                    letterSpacing: 1.0,
                    color: const Color(0xFF9CA3AF),
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              const SizedBox(width: 8),
              StatusTag(
                label: phase.label,
                variant: _variantForPhase(phase),
              ),
            ],
          ),
          const SizedBox(height: 12),
          // Title
          Text(
            meta.packageSummary,
            style: GoogleFonts.inter(
              fontSize: 16,
              fontWeight: FontWeight.w500,
              color: AppColors.primaryText,
              height: 1.3,
            ),
          ),
          const SizedBox(height: 10),
          // Info line
          Text(
            '${meta.aiSegmentCount} AI scenes + ${meta.captureTaskCount} capture tasks',
            style: GoogleFonts.inter(
              fontSize: 14,
              color: AppColors.secondaryText,
            ),
          ),
          const SizedBox(height: 4),
          // Duration line
          Text(
            '${job.totalDurationSec.toStringAsFixed(0)}s video',
            style: GoogleFonts.inter(
              fontSize: 12,
              color: const Color(0xFF9CA3AF),
            ),
          ),
          const SizedBox(height: 20),
          // CTA button
          SizedBox(
            width: double.infinity,
            child: TextButton(
              onPressed: () {
                AppStateProvider.of(context).selectJob(job);
                onJobAccepted?.call();
              },
              style: TextButton.styleFrom(
                backgroundColor: AppColors.buttonPrimary,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
              ),
              child: Text(
                _ctaLabel(phase),
                style: GoogleFonts.inter(
                  fontSize: 15,
                  fontWeight: FontWeight.w500,
                  color: Colors.white,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  /// Map [JobPhase] to a [TagVariant] for the status badge.
  static TagVariant _variantForPhase(JobPhase phase) {
    return switch (phase) {
      JobPhase.awaitingCapture => TagVariant.yellow,
      JobPhase.renderingPreview => TagVariant.purple,
      JobPhase.readyForReview => TagVariant.green,
      JobPhase.approvedForPublish => TagVariant.green,
      JobPhase.published => TagVariant.gray,
    };
  }

  /// CTA button label depends on the current phase.
  static String _ctaLabel(JobPhase phase) {
    return switch (phase) {
      JobPhase.awaitingCapture => 'Accept & Let AI Start',
      JobPhase.renderingPreview => 'View Progress',
      JobPhase.readyForReview => 'Review Draft',
      JobPhase.approvedForPublish => 'View',
      JobPhase.published => 'View',
    };
  }
}
