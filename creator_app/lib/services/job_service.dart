import 'dart:convert';
import 'package:flutter/services.dart' show rootBundle;
import '../models/job.dart';

class JobService {
  /// Load all jobs from bundled assets.
  /// MVP: scans known fixture files. Production: would call an API.
  static Future<List<Job>> loadJobs() async {
    // For MVP, we load the single demo job from bundled assets
    const jobIds = ['ditto-demo'];
    final jobs = <Job>[];

    for (final id in jobIds) {
      try {
        final job = await loadJob(id);
        jobs.add(job);
      } catch (e) {
        // Skip jobs that fail to parse
      }
    }

    return jobs;
  }

  /// Load a single job by ID from bundled assets.
  static Future<Job> loadJob(String jobId) async {
    final pkgJson = await rootBundle.loadString('assets/jobs/$jobId.package.json');
    final statusJson = await rootBundle.loadString('assets/jobs/$jobId.status.json');

    final package_ = JobPackage.fromJson(
      json.decode(pkgJson) as Map<String, dynamic>,
    );
    final status = JobStatusData.fromJson(
      json.decode(statusJson) as Map<String, dynamic>,
    );

    return Job(package_: package_, status: status);
  }
}
