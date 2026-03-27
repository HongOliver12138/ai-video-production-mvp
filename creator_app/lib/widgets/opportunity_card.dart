import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../theme/app_colors.dart';
import '../theme/app_styles.dart';

/// A pre-approved opportunity card matching the "Vibe Reference" block
/// from components-step2.html: 16:9 cover, play overlay, label + hint.
class OpportunityCard extends StatelessWidget {
  const OpportunityCard({
    super.key,
    required this.title,
    required this.subtitle,
    this.imageUrl,
    this.tag,
    this.hint,
    this.onTap,
  });

  final String title;
  final String subtitle;
  final String? imageUrl;
  final String? tag;
  final String? hint;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(24),
          boxShadow: const [AppStyles.premiumShadow],
        ),
        clipBehavior: Clip.antiAlias,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // 16:9 cover image with dark overlay + play button
            AspectRatio(
              aspectRatio: 16 / 9,
              child: Stack(
                fit: StackFit.expand,
                children: [
                  // Background
                  Container(color: const Color(0xFF111827)),
                  if (imageUrl != null)
                    Opacity(
                      opacity: 0.6,
                      child: Image.network(imageUrl!, fit: BoxFit.cover),
                    ),
                  // Play button
                  Center(
                    child: Container(
                      width: 48,
                      height: 48,
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.2),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(
                        Icons.play_arrow_rounded,
                        color: Colors.white,
                        size: 28,
                      ),
                    ),
                  ),
                  // Tag (top-right)
                  if (tag != null)
                    Positioned(
                      top: 12,
                      right: 12,
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color: AppColors.grayBg,
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          tag!,
                          style: GoogleFonts.inter(
                            fontSize: 10,
                            color: AppColors.secondaryText,
                          ),
                        ),
                      ),
                    ),
                ],
              ),
            ),
            // Text content
            Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: GoogleFonts.inter(
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                      color: AppColors.primaryText,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    subtitle,
                    style: GoogleFonts.inter(
                      fontSize: 13,
                      color: AppColors.secondaryText,
                    ),
                  ),
                  if (hint != null) ...[
                    const SizedBox(height: 8),
                    Text(
                      hint!,
                      style: GoogleFonts.inter(
                        fontSize: 12,
                        color: AppColors.secondaryText,
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
