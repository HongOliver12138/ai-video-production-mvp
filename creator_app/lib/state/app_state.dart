import 'package:flutter/material.dart';
import '../models/job.dart';
import '../services/job_service.dart';

class AppState extends ChangeNotifier {
  List<Job> jobs = [];
  Job? selectedJob;
  bool loading = true;

  Future<void> loadJobs() async {
    loading = true;
    notifyListeners();
    jobs = await JobService.loadJobs();
    loading = false;
    notifyListeners();
  }

  void selectJob(Job job) {
    selectedJob = job;
    notifyListeners();
  }

  void updateJobPhase(JobPhase phase) {
    if (selectedJob == null) return;
    // In MVP, we create a new status with the updated phase
    final oldStatus = selectedJob!.status;
    final newStatus = JobStatusData(
      jobId: oldStatus.jobId,
      phase: phase,
      captureProgress: oldStatus.captureProgress,
      outputFile: oldStatus.outputFile,
    );
    selectedJob = Job(package_: selectedJob!.package_, status: newStatus);
    // Update in list too
    final idx = jobs.indexWhere((j) => j.jobId == selectedJob!.jobId);
    if (idx >= 0) jobs[idx] = selectedJob!;
    notifyListeners();
  }
}

/// InheritedWidget wrapper for AppState
class AppStateProvider extends InheritedNotifier<AppState> {
  const AppStateProvider({
    super.key,
    required AppState state,
    required super.child,
  }) : super(notifier: state);

  static AppState of(BuildContext context) {
    return context
        .dependOnInheritedWidgetOfExactType<AppStateProvider>()!
        .notifier!;
  }
}
