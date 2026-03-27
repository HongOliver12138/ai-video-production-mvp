import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../theme/app_colors.dart';
import '../theme/app_styles.dart';
import '../widgets/primary_button.dart';

/// Account & Wallet screen — matches account.html pixel-for-pixel.
class AccountScreen extends StatelessWidget {
  const AccountScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return ColoredBox(
      color: const Color(0xFFFAFAFA),
      child: SafeArea(
        bottom: false,
        child: Column(
          children: [
            // Top bar
            Padding(
              padding: const EdgeInsets.fromLTRB(24, 20, 24, 8),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Account',
                    style: GoogleFonts.inter(
                      fontSize: 28,
                      fontWeight: FontWeight.w600,
                      color: AppColors.primaryText,
                      letterSpacing: -0.5,
                    ),
                  ),
                  Container(
                    width: 40,
                    height: 40,
                    decoration: BoxDecoration(
                      color: AppColors.surface,
                      shape: BoxShape.circle,
                      boxShadow: const [AppStyles.premiumShadow],
                    ),
                    child: const Icon(Icons.settings_outlined, size: 20, color: AppColors.primaryText),
                  ),
                ],
              ),
            ),
            // Scrollable body
            Expanded(
              child: ListView(
                padding: const EdgeInsets.fromLTRB(20, 12, 20, 120),
                children: [
                  _buildWalletCard(),
                  const SizedBox(height: 24),
                  _buildActivitySection(),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildWalletCard() {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(28),
        boxShadow: const [AppStyles.premiumShadow],
      ),
      clipBehavior: Clip.antiAlias,
      padding: const EdgeInsets.all(24),
      child: Stack(
        children: [
          // Purple blur accent (top-right)
          Positioned(
            top: -40,
            right: -40,
            child: Container(
              width: 128,
              height: 128,
              decoration: BoxDecoration(
                color: AppColors.purpleBg.withOpacity(0.6),
                shape: BoxShape.circle,
              ),
            ),
          ),
          // Content
          Column(
            children: [
              Text(
                'AVAILABLE TO WITHDRAW',
                style: GoogleFonts.inter(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: AppColors.secondaryText,
                  letterSpacing: 2.0,
                ),
              ),
              const SizedBox(height: 8),
              // Massive balance — Row with $ top-aligned to 1,250
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Padding(
                    padding: const EdgeInsets.only(top: 2, right: 2),
                    child: Text(
                      '\$',
                      style: GoogleFonts.inter(
                        fontSize: 32,
                        fontWeight: FontWeight.w600,
                        color: const Color(0xFF9CA3AF),
                        height: 1.1,
                      ),
                    ),
                  ),
                  Text(
                    '1,250',
                    style: GoogleFonts.inter(
                      fontSize: 52,
                      fontWeight: FontWeight.w600,
                      color: const Color(0xFF111827),
                      letterSpacing: -2.0,
                      height: 1.1,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 24),
              // Cash Out button
              SizedBox(
                width: double.infinity,
                child: TextButton(
                  onPressed: () {},
                  style: TextButton.styleFrom(
                    backgroundColor: AppColors.buttonPrimary,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(18),
                    ),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.credit_card_outlined, size: 20, color: Colors.white),
                      const SizedBox(width: 8),
                      Text(
                        'Cash Out',
                        style: GoogleFonts.inter(
                          fontSize: 16,
                          fontWeight: FontWeight.w500,
                          color: Colors.white,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 20),
              // Bank info row
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      Container(
                        width: 24,
                        height: 24,
                        decoration: BoxDecoration(
                          color: AppColors.background,
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: const Icon(Icons.account_balance, size: 14, color: AppColors.primaryText),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        'Chase ****4092',
                        style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w500, color: AppColors.secondaryText),
                      ),
                    ],
                  ),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text(
                        'Pending (30 days)',
                        style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w500, color: AppColors.secondaryText),
                      ),
                      Text(
                        '\$500.00',
                        style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.primaryText),
                      ),
                    ],
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildActivitySection() {
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 8),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Recent Activity',
                style: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.w600, color: AppColors.primaryText),
              ),
              Text(
                'View all',
                style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w500, color: const Color(0xFF9CA3AF)),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        Container(
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.circular(24),
            boxShadow: const [AppStyles.premiumShadow],
          ),
          padding: const EdgeInsets.all(12),
          child: Column(
            children: [
              _ActivityRow(title: 'CBD Luxury Basket', subtitle: 'Today • TikTok', amount: '+\$500', status: 'Pending', statusBg: AppColors.yellowBg, statusFg: AppColors.yellowText),
              const Divider(height: 1, color: AppColors.background),
              _ActivityRow(title: 'Whitsunday Boho', subtitle: 'Oct 12 • IG Reels', amount: '+\$250', status: 'Paid', statusBg: AppColors.greenBg, statusFg: AppColors.greenText),
              const Divider(height: 1, color: AppColors.background),
              _ActivityRow(title: 'Withdraw to Chase', subtitle: 'Oct 01', amount: '- \$800', isWithdraw: true),
            ],
          ),
        ),
      ],
    );
  }
}

class _ActivityRow extends StatelessWidget {
  const _ActivityRow({
    required this.title,
    required this.subtitle,
    required this.amount,
    this.status,
    this.statusBg,
    this.statusFg,
    this.isWithdraw = false,
  });

  final String title;
  final String subtitle;
  final String amount;
  final String? status;
  final Color? statusBg;
  final Color? statusFg;
  final bool isWithdraw;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 4),
      child: Row(
        children: [
          // Thumbnail
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: isWithdraw ? AppColors.background : const Color(0xFFF9FAFB),
              borderRadius: BorderRadius.circular(10),
              border: isWithdraw ? null : Border.all(color: AppColors.background),
            ),
            child: Icon(
              isWithdraw ? Icons.swap_horiz_rounded : Icons.image_outlined,
              size: 20,
              color: AppColors.secondaryText,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.primaryText),
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 2),
                Text(
                  subtitle,
                  style: GoogleFonts.inter(fontSize: 11, color: const Color(0xFF9CA3AF)),
                ),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                amount,
                style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.primaryText),
              ),
              if (status != null)
                Container(
                  margin: const EdgeInsets.only(top: 4),
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: statusBg,
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Text(
                    status!.toUpperCase(),
                    style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w700, color: statusFg),
                  ),
                ),
            ],
          ),
        ],
      ),
    );
  }
}
