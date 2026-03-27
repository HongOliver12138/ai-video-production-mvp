// ============================================================
// Job Phase — 5-state machine
// ============================================================

enum JobPhase {
  awaitingCapture,
  renderingPreview,
  readyForReview,
  approvedForPublish,
  published;

  static JobPhase fromString(String s) {
    switch (s) {
      case 'awaiting_capture':
        return JobPhase.awaitingCapture;
      case 'rendering_preview':
        return JobPhase.renderingPreview;
      case 'ready_for_review':
        return JobPhase.readyForReview;
      case 'approved_for_publish':
        return JobPhase.approvedForPublish;
      case 'published':
        return JobPhase.published;
      default:
        return JobPhase.awaitingCapture;
    }
  }

  String get label {
    switch (this) {
      case JobPhase.awaitingCapture:
        return 'Awaiting Capture';
      case JobPhase.renderingPreview:
        return 'Rendering';
      case JobPhase.readyForReview:
        return 'Ready for Review';
      case JobPhase.approvedForPublish:
        return 'Approved';
      case JobPhase.published:
        return 'Published';
    }
  }
}

// ============================================================
// Package Meta
// ============================================================

class PackageMeta {
  final String selectedProductionPattern;
  final bool zeroCreatorShootPossible;
  final bool creatorCaptureRequired;
  final int totalSegments;
  final int aiSegmentCount;
  final int captureTaskCount;
  final String packageSummary;

  const PackageMeta({
    required this.selectedProductionPattern,
    required this.zeroCreatorShootPossible,
    required this.creatorCaptureRequired,
    required this.totalSegments,
    required this.aiSegmentCount,
    required this.captureTaskCount,
    required this.packageSummary,
  });

  factory PackageMeta.fromJson(Map<String, dynamic> json) => PackageMeta(
        selectedProductionPattern: json['selectedProductionPattern'] as String,
        zeroCreatorShootPossible: json['zeroCreatorShootPossible'] as bool,
        creatorCaptureRequired: json['creatorCaptureRequired'] as bool,
        totalSegments: json['totalSegments'] as int,
        aiSegmentCount: json['aiSegmentCount'] as int,
        captureTaskCount: json['captureTaskCount'] as int,
        packageSummary: json['packageSummary'] as String,
      );
}

// ============================================================
// AI Segment
// ============================================================

class AISegment {
  final String segmentId;
  final String narrativeRole;
  final String method;
  final List<String> requiredInputs;
  final String readinessStatus;

  const AISegment({
    required this.segmentId,
    required this.narrativeRole,
    required this.method,
    required this.requiredInputs,
    required this.readinessStatus,
  });

  factory AISegment.fromJson(Map<String, dynamic> json) => AISegment(
        segmentId: json['segmentId'] as String,
        narrativeRole: json['narrativeRole'] as String,
        method: json['method'] as String,
        requiredInputs: (json['requiredInputs'] as List).cast<String>(),
        readinessStatus: json['readinessStatus'] as String,
      );
}

// ============================================================
// Capture Task Card
// ============================================================

class CaptureTaskCard {
  final String taskId;
  final String segmentId;
  final String narrativeRole;
  final String taskType;
  final String taskObjective;
  final String exactAction;
  final int durationLimitSeconds;
  final String framingInstruction;
  final String deliveryMode;
  final List<String> acceptanceCriteria;
  final List<String> retakeHints;
  final String priority;
  final String estimatedEffort;

  const CaptureTaskCard({
    required this.taskId,
    required this.segmentId,
    required this.narrativeRole,
    required this.taskType,
    required this.taskObjective,
    required this.exactAction,
    required this.durationLimitSeconds,
    required this.framingInstruction,
    required this.deliveryMode,
    required this.acceptanceCriteria,
    required this.retakeHints,
    required this.priority,
    required this.estimatedEffort,
  });

  factory CaptureTaskCard.fromJson(Map<String, dynamic> json) =>
      CaptureTaskCard(
        taskId: json['taskId'] as String,
        segmentId: json['segmentId'] as String,
        narrativeRole: json['narrativeRole'] as String,
        taskType: json['taskType'] as String,
        taskObjective: json['taskObjective'] as String,
        exactAction: json['exactAction'] as String,
        durationLimitSeconds: json['durationLimitSeconds'] as int,
        framingInstruction: json['framingInstruction'] as String,
        deliveryMode: json['deliveryMode'] as String,
        acceptanceCriteria:
            (json['acceptanceCriteria'] as List).cast<String>(),
        retakeHints: (json['retakeHints'] as List).cast<String>(),
        priority: json['priority'] as String,
        estimatedEffort: json['estimatedEffort'] as String,
      );
}

// ============================================================
// Capture Task Summary
// ============================================================

class CaptureTaskSummary {
  final int totalTasks;
  final int totalEstimatedCaptureSeconds;
  final String creatorBurdenEstimate;
  final bool requiresProductInHand;
  final String anchorStrategy;
  final String summary;

  const CaptureTaskSummary({
    required this.totalTasks,
    required this.totalEstimatedCaptureSeconds,
    required this.creatorBurdenEstimate,
    required this.requiresProductInHand,
    required this.anchorStrategy,
    required this.summary,
  });

  factory CaptureTaskSummary.fromJson(Map<String, dynamic> json) =>
      CaptureTaskSummary(
        totalTasks: json['totalTasks'] as int,
        totalEstimatedCaptureSeconds:
            json['totalEstimatedCaptureSeconds'] as int,
        creatorBurdenEstimate: json['creatorBurdenEstimate'] as String,
        requiresProductInHand: json['requiresProductInHand'] as bool,
        anchorStrategy: json['anchorStrategy'] as String,
        summary: json['summary'] as String,
      );
}

// ============================================================
// Render Scene (from decomposition engine format)
// ============================================================

class RenderSceneData {
  final String sceneId;
  final String segmentId;
  final String purpose;
  final double durationSec;
  final String visualType;
  final String voiceoverMode;
  final String voiceoverText;
  final String subtitleText;
  final String layoutHint;

  const RenderSceneData({
    required this.sceneId,
    required this.segmentId,
    required this.purpose,
    required this.durationSec,
    required this.visualType,
    required this.voiceoverMode,
    required this.voiceoverText,
    required this.subtitleText,
    required this.layoutHint,
  });

  bool get isCaptureScene => visualType == 'captured_video';
  bool get isTtsScene => voiceoverMode == 'tts';

  factory RenderSceneData.fromJson(Map<String, dynamic> json) =>
      RenderSceneData(
        sceneId: json['sceneId'] as String,
        segmentId: json['segmentId'] as String,
        purpose: json['purpose'] as String,
        durationSec: (json['durationSec'] as num).toDouble(),
        visualType: json['visualType'] as String,
        voiceoverMode: json['voiceoverMode'] as String,
        voiceoverText: json['voiceoverText'] as String? ?? '',
        subtitleText: json['subtitleText'] as String? ?? '',
        layoutHint: json['layoutHint'] as String? ?? '',
      );
}

// ============================================================
// Render Spec
// ============================================================

class RenderSpecGroup {
  final int width;
  final int height;
  final int fps;
  final double totalDurationSec;
  final String renderSummary;
  final List<RenderSceneData> scenes;

  const RenderSpecGroup({
    required this.width,
    required this.height,
    required this.fps,
    required this.totalDurationSec,
    required this.renderSummary,
    required this.scenes,
  });

  factory RenderSpecGroup.fromJson(Map<String, dynamic> json) =>
      RenderSpecGroup(
        width: json['width'] as int,
        height: json['height'] as int,
        fps: json['fps'] as int,
        totalDurationSec: (json['totalDurationSec'] as num).toDouble(),
        renderSummary: json['renderSummary'] as String,
        scenes: (json['scenes'] as List)
            .map((s) => RenderSceneData.fromJson(s as Map<String, dynamic>))
            .toList(),
      );
}

// ============================================================
// Capture Progress (from status.json)
// ============================================================

class CaptureProgress {
  final int totalTasks;
  final int completedTasks;
  final Map<String, String> taskStatus;

  const CaptureProgress({
    required this.totalTasks,
    required this.completedTasks,
    required this.taskStatus,
  });

  factory CaptureProgress.fromJson(Map<String, dynamic> json) =>
      CaptureProgress(
        totalTasks: json['totalTasks'] as int,
        completedTasks: json['completedTasks'] as int,
        taskStatus: (json['taskStatus'] as Map<String, dynamic>)
            .map((k, v) => MapEntry(k, v as String)),
      );
}

// ============================================================
// Job Status (from status.json)
// ============================================================

class JobStatusData {
  final String jobId;
  final JobPhase phase;
  final CaptureProgress captureProgress;
  final String? outputFile;

  const JobStatusData({
    required this.jobId,
    required this.phase,
    required this.captureProgress,
    this.outputFile,
  });

  factory JobStatusData.fromJson(Map<String, dynamic> json) => JobStatusData(
        jobId: json['jobId'] as String,
        phase: JobPhase.fromString(json['status'] as String),
        captureProgress: CaptureProgress.fromJson(
            json['captureProgress'] as Map<String, dynamic>),
        outputFile: (json['render'] as Map<String, dynamic>?)?['outputFile']
            as String?,
      );
}

// ============================================================
// Job Package (from package.json)
// ============================================================

class JobPackage {
  final String jobId;
  final String referenceVideoId;
  final PackageMeta packageMeta;
  final List<AISegment> aiSegments;
  final List<CaptureTaskCard> taskCards;
  final CaptureTaskSummary taskSummary;
  final RenderSpecGroup renderSpec;

  const JobPackage({
    required this.jobId,
    required this.referenceVideoId,
    required this.packageMeta,
    required this.aiSegments,
    required this.taskCards,
    required this.taskSummary,
    required this.renderSpec,
  });

  factory JobPackage.fromJson(Map<String, dynamic> json) {
    final ct = json['captureTasks'] as Map<String, dynamic>;
    return JobPackage(
      jobId: json['jobId'] as String,
      referenceVideoId: json['referenceVideoId'] as String,
      packageMeta:
          PackageMeta.fromJson(json['packageMeta'] as Map<String, dynamic>),
      aiSegments: (json['aiSegments'] as List)
          .map((s) => AISegment.fromJson(s as Map<String, dynamic>))
          .toList(),
      taskCards: (ct['taskCards'] as List)
          .map((t) => CaptureTaskCard.fromJson(t as Map<String, dynamic>))
          .toList(),
      taskSummary: CaptureTaskSummary.fromJson(
          ct['taskSummary'] as Map<String, dynamic>),
      renderSpec: RenderSpecGroup.fromJson(
          json['renderSpec'] as Map<String, dynamic>),
    );
  }
}

// ============================================================
// Job — combines Package + Status
// ============================================================

class Job {
  final JobPackage package_;
  final JobStatusData status;

  const Job({required this.package_, required this.status});

  String get jobId => package_.jobId;
  JobPhase get phase => status.phase;
  PackageMeta get meta => package_.packageMeta;
  List<RenderSceneData> get scenes => package_.renderSpec.scenes;
  List<CaptureTaskCard> get taskCards => package_.taskCards;
  double get totalDurationSec => package_.renderSpec.totalDurationSec;

  int get pendingCaptureTasks {
    int count = 0;
    for (final card in taskCards) {
      final taskStatus = status.captureProgress.taskStatus[card.taskId];
      if (taskStatus != 'done') count++;
    }
    return count;
  }
}
