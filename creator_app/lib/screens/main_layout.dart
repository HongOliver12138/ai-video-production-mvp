import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../theme/app_colors.dart';
import '../state/app_state.dart';
import '../screens/matches_screen.dart';
import '../screens/timeline_screen.dart';
import '../screens/publish_screen.dart';
import '../screens/account_screen.dart';

/// Root layout with custom bottom nav bar.
class MainLayout extends StatefulWidget {
  const MainLayout({super.key});

  @override
  State<MainLayout> createState() => _MainLayoutState();
}

class _MainLayoutState extends State<MainLayout> {
  int _currentIndex = 0;

  void _goToTab(int index) {
    setState(() => _currentIndex = index);
  }

  @override
  Widget build(BuildContext context) {
    final appState = AppStateProvider.of(context);
    final pendingTasks = appState.selectedJob?.pendingCaptureTasks ?? 0;

    final screens = <Widget>[
      MatchesScreen(onJobAccepted: () => _goToTab(1)),
      const TimelineScreen(),
      const PublishScreen(),
      const AccountScreen(),
    ];

    return Scaffold(
      body: IndexedStack(index: _currentIndex, children: screens),
      bottomNavigationBar: _CustomNavBar(
        currentIndex: _currentIndex,
        onTap: _goToTab,
        pendingTasks: pendingTasks,
      ),
    );
  }
}

class _NavItem {
  final IconData icon;
  final IconData activeIcon;
  final String label;
  const _NavItem({required this.icon, required this.activeIcon, required this.label});
}

const _items = [
  _NavItem(icon: Icons.home_outlined, activeIcon: Icons.home_rounded, label: 'Jobs'),
  _NavItem(icon: Icons.check_circle_outline_rounded, activeIcon: Icons.check_circle_rounded, label: 'Timeline'),
  _NavItem(icon: Icons.inventory_2_outlined, activeIcon: Icons.inventory_2_rounded, label: 'Preview'),
  _NavItem(icon: Icons.person_outline_rounded, activeIcon: Icons.person_rounded, label: 'Account'),
];

class _CustomNavBar extends StatelessWidget {
  const _CustomNavBar({required this.currentIndex, required this.onTap, this.pendingTasks = 0});

  final int currentIndex;
  final ValueChanged<int> onTap;
  final int pendingTasks;

  @override
  Widget build(BuildContext context) {
    final bottomPadding = MediaQuery.of(context).padding.bottom;

    return Container(
      padding: EdgeInsets.only(top: 12, bottom: bottomPadding + 8),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.95),
        border: const Border(top: BorderSide(color: Color(0xFFF3F4F6))),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: List.generate(_items.length, (i) {
          final item = _items[i];
          final isActive = i == currentIndex;
          final showBadge = i == 1 && pendingTasks > 0;

          return GestureDetector(
            behavior: HitTestBehavior.opaque,
            onTap: () => onTap(i),
            child: SizedBox(
              width: 64,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Stack(
                    clipBehavior: Clip.none,
                    children: [
                      Icon(
                        isActive ? item.activeIcon : item.icon,
                        size: 24,
                        color: isActive ? AppColors.primaryText : const Color(0xFF9CA3AF),
                      ),
                      if (showBadge)
                        Positioned(
                          top: -2,
                          right: -4,
                          child: Container(
                            width: 10,
                            height: 10,
                            decoration: BoxDecoration(
                              color: const Color(0xFFEF4444),
                              shape: BoxShape.circle,
                              border: Border.all(color: Colors.white, width: 2),
                            ),
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    item.label,
                    style: GoogleFonts.inter(
                      fontSize: 10,
                      fontWeight: isActive ? FontWeight.w600 : FontWeight.w400,
                      color: isActive ? AppColors.primaryText : const Color(0xFF9CA3AF),
                    ),
                  ),
                ],
              ),
            ),
          );
        }),
      ),
    );
  }
}
