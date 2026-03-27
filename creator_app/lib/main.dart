import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';

import 'theme/app_colors.dart';
import 'screens/main_layout.dart';
import 'state/app_state.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
    statusBarColor: Colors.transparent,
    statusBarIconBrightness: Brightness.dark,
  ));

  final appState = AppState();
  await appState.loadJobs();

  runApp(AppStateProvider(state: appState, child: const CreatorApp()));
}

class CreatorApp extends StatelessWidget {
  const CreatorApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Creator App',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        scaffoldBackgroundColor: AppColors.background,
        textTheme: GoogleFonts.interTextTheme(),
        splashFactory: NoSplash.splashFactory,
        highlightColor: Colors.transparent,
      ),
      home: const _MobileShell(),
    );
  }
}

/// Constrains the app to 430px max width on web/desktop,
/// centered on a #E5E7EB background to simulate a mobile device.
class _MobileShell extends StatelessWidget {
  const _MobileShell();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFE5E7EB),
      body: Center(
        child: SizedBox(
          width: 430,
          child: const MainLayout(),
        ),
      ),
    );
  }
}
