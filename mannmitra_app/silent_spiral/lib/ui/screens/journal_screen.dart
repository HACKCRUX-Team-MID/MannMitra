import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:silent_spiral/core/theme.dart';
import 'package:silent_spiral/models/journal_entry.dart';
import 'package:silent_spiral/services/health_service.dart';
import 'package:silent_spiral/services/ai_engine_service.dart';
import 'package:silent_spiral/services/llm_service.dart' show EmotionResult, EmotionTrigger; // for models
import 'package:silent_spiral/services/local_storage_service.dart';
import 'package:silent_spiral/services/firestore_service.dart';
import 'package:silent_spiral/ui/widgets/custom_button.dart';
import 'package:speech_to_text/speech_to_text.dart' as stt;
import 'package:silent_spiral/ui/widgets/emotion_lexicon.dart';
import 'package:silent_spiral/ui/widgets/grounding_breathing_halo.dart';
import 'package:silent_spiral/ui/widgets/glass_container.dart';
import 'package:silent_spiral/services/pattern_service.dart';

class JournalScreen extends ConsumerStatefulWidget {
  const JournalScreen({super.key});

  @override
  ConsumerState<JournalScreen> createState() => _JournalScreenState();
}

class _JournalScreenState extends ConsumerState<JournalScreen> {
  final TextEditingController _controller = TextEditingController();
  bool _isSaving = false;
  bool _isRemixing = false;
  String? _remixSuggestion;
  
  // New State variables
  bool _isGrounding = true;
  String? _selectedLexiconEmotion;
  Set<String> _selectedTags = {};
  
  List<String> _availableTags = [
    '#Work', '#Exams', '#Family', '#Relationships', 
    '#Health', '#Finance', '#SelfCare', '#Sleep'
  ];
  
  // AI Analysis results shown inline
  EmotionResult? _aiAnalysis;
  bool _showTriggers = false; // "Why this?" toggle
  String? _lastSavedEntryId; // for correction tracking
  String? _journalingPrompt; // Pre-journaling contextual prompt
  bool _vocabularyExpanded = false; // Vocabulary note expansion state
  
  // Speech to Text
  final stt.SpeechToText _speech = stt.SpeechToText();
  bool _isListening = false;
  
  @override
  void initState() {
    super.initState();
    _initSpeech();
    Future.microtask(() {
      _loadCustomTags();
      _loadJournalingPrompt();
    });
  }

  void _loadJournalingPrompt() {
    final patternService = ref.read(patternServiceProvider);
    setState(() {
      _journalingPrompt = patternService.generateJournalingPrompt();
    });
  }
  
  void _loadCustomTags() {
    final localDb = ref.read(localStorageProvider);
    final customTags = localDb.getCustomTags();
    setState(() {
      for (var tag in customTags.reversed) {
        if (!_availableTags.contains(tag)) {
          _availableTags.insert(0, tag);
        }
      }
    });
  }

  void _showAddTagDialog() {
    final tc = TextEditingController();
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppTheme.surfaceDarkElevated,
        title: const Text("Custom Tag", style: TextStyle(color: AppTheme.textPrimary)),
        content: TextField(
          controller: tc,
          style: const TextStyle(color: AppTheme.textPrimary),
          decoration: const InputDecoration(
             hintText: "e.g., Hackathon",
             hintStyle: TextStyle(color: AppTheme.textSecondary),
             prefixText: "#",
             prefixStyle: TextStyle(color: AppTheme.accent),
          ),
          autofocus: true,
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text("Cancel", style: TextStyle(color: AppTheme.textSecondary)),
          ),
          TextButton(
            onPressed: () {
              final newTagStr = tc.text.trim().replaceAll(" ", "");
              if (newTagStr.isNotEmpty) {
                final newTag = "#$newTagStr";
                setState(() {
                  if (!_availableTags.contains(newTag)) {
                    _availableTags.insert(0, newTag);
                    _selectedTags.add(newTag);
                    final localDb = ref.read(localStorageProvider);
                    final custom = localDb.getCustomTags();
                    if (!custom.contains(newTag)) {
                      custom.add(newTag);
                      localDb.saveCustomTags(custom);
                    }
                  } else {
                     _selectedTags.add(newTag);
                  }
                });
              }
              Navigator.pop(context);
            },
            child: const Text("Add", style: TextStyle(color: AppTheme.accent)),
          ),
        ],
      ),
    );
  }

  void _initSpeech() async {
    await _speech.initialize();
  }

  void _listen() async {
    // Check for voice consent before first use
    final localDb = ref.read(localStorageProvider);
    if (!localDb.hasVoiceConsent()) {
      final consent = await _showVoiceConsentDialog();
      if (consent != true) return;
      await localDb.setVoiceConsent(true);
    }

    if (!_isListening) {
      bool available = await _speech.initialize(
        onStatus: (val) => debugPrint('onStatus: $val'),
        onError: (val) => debugPrint('onError: $val'),
      );
      if (available) {
        setState(() => _isListening = true);
        _speech.listen(
          onResult: (val) => setState(() {
            _controller.text = val.recognizedWords;
          }),
        );
      }
    } else {
      setState(() => _isListening = false);
      _speech.stop();
    }
  }

  Future<bool?> _showVoiceConsentDialog() {
    return showDialog<bool>(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppTheme.surfaceDarkElevated,
        title: const Text('🎤 Voice Input Privacy', style: TextStyle(color: AppTheme.accent)),
        content: const Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Voice input is processed by your device\'s speech-to-text engine (Google STT on Android, Siri on iOS).',
              style: TextStyle(color: AppTheme.textPrimary, height: 1.5),
            ),
            SizedBox(height: 12),
            Text(
              '• MannMitra does NOT record or store audio\n'
              '• Audio may be sent to your device OS provider\n'
              '• Enable offline STT in your device settings for maximum privacy',
              style: TextStyle(color: AppTheme.textSecondary, fontSize: 12, height: 1.6),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel', style: TextStyle(color: AppTheme.textSecondary)),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('I Understand', style: TextStyle(color: AppTheme.accent, fontWeight: FontWeight.w700)),
          ),
        ],
      ),
    );
  }

  Future<void> _handleSave() async {
    String text = _controller.text.trim();
    if (text.isEmpty && _selectedLexiconEmotion == null) return;
    
    // Prepend the selected emotion so the AI has more context
    if (_selectedLexiconEmotion != null) {
      text = "I am feeling $_selectedLexiconEmotion. $text";
    }

    // Append tags
    if (_selectedTags.isNotEmpty) {
      text += "\n\nContext Tags: ${_selectedTags.join(', ')}";
    }

    setState(() => _isSaving = true);

    try {
      final healthService = ref.read(healthServiceProvider);
      final aiEngine = ref.read(aiEngineProvider);
      final localDb = ref.read(localStorageProvider);

      final healthData = await healthService.fetchHealthDataSummary();
      
      // Use the new TFLite-based on-device analysis with Context Layer
      final analysisResult = aiEngine.analyzePipeline(text);

      final entry = JournalEntry(
        id: DateTime.now().millisecondsSinceEpoch.toString(),
        text: text,
        timestamp: DateTime.now(),
        primaryEmotion: analysisResult.primaryEmotion,
        intensityScore: analysisResult.intensityScore,
        reflectionPrompt: analysisResult.reflectionPrompt,
        remixes: _remixSuggestion != null ? [_remixSuggestion!] : null,
      );

      await localDb.saveEntry(entry);
      
      // Cloud sync is disabled by default (privacy-first)
      final firestoreService = ref.read(firestoreServiceProvider);
      firestoreService.syncEntryToCloud(entry);
      
      if (mounted) {
        setState(() {
          _aiAnalysis = analysisResult;
          _lastSavedEntryId = entry.id;
        });
        // Record temporal pattern
        localDb.saveEmotionTimestamp(analysisResult.primaryEmotion);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error saving: $e')));
      }
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  Future<void> _handleRemix() async {
    final text = _controller.text.trim();
    if (text.isEmpty) return;

    setState(() => _isRemixing = true);
    try {
      final llmService = ref.read(llmServiceProvider);
      final healthService = ref.read(healthServiceProvider);
      final healthData = await healthService.fetchHealthDataSummary();

      final remix = llmService.generateRemix(
        text,
        selectedEmotion: _selectedLexiconEmotion,
        healthData: healthData,
      );
      if (mounted) {
        setState(() => _remixSuggestion = remix);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error remixing: $e')));
      }
    } finally {
      if (mounted) setState(() => _isRemixing = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        leading: const CloseButton(),
        title: const Text("Reflect", style: TextStyle(fontSize: 18, letterSpacing: 1)),
        actions: [
          IconButton(
            icon: Icon(
              _isListening ? Icons.mic : Icons.mic_none_rounded, 
              size: 28,
              color: _isListening ? AppTheme.terracotta : AppTheme.textPrimary,
            ),
            onPressed: _listen,
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: _aiAnalysis != null
          ? _buildAnalysisView()
          : Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
              child: Column(
                children: [
                  // Non-clinical disclaimer
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: AppTheme.warmGold.withValues(alpha: 0.08),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Text(
                      "🛡️ This app helps you reflect — it is not a clinical diagnostic tool.",
                      style: TextStyle(color: AppTheme.textSecondary, fontSize: 11),
                      textAlign: TextAlign.center,
                    ),
                  ),
                  const SizedBox(height: 8),
                  if (_isGrounding)
                     Expanded(
                       child: GroundingBreathingHalo(
                         onComplete: () => setState(() => _isGrounding = false),
                       )
                     )
                  else ...[
                    // Pre-journaling prompt card
                    if (_journalingPrompt != null)
                      Container(
                        width: double.infinity,
                        margin: const EdgeInsets.only(bottom: 12),
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: AppTheme.accent.withValues(alpha: 0.08),
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(color: AppTheme.accent.withValues(alpha: 0.25)),
                        ),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('💬', style: TextStyle(fontSize: 18)),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Text(
                                _journalingPrompt!,
                                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                  color: AppTheme.textPrimary,
                                  fontStyle: FontStyle.italic,
                                  height: 1.5,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ).animate().fade(delay: 100.ms),
                    EmotionLexicon(
                      onEmotionSelected: (emotion) => setState(() => _selectedLexiconEmotion = emotion),
                    ).animate().fade().slideY(begin: -0.1),
                    const SizedBox(height: 16),
                    Expanded(
                      child: TextField(
                        controller: _controller,
                        maxLines: null,
                        keyboardType: TextInputType.multiline,
                        style: Theme.of(context).textTheme.bodyLarge?.copyWith(fontSize: 20, height: 1.6),
                        decoration: const InputDecoration(
                          hintText: "What's occupying your mind right now?",
                          border: InputBorder.none,
                          enabledBorder: InputBorder.none,
                          focusedBorder: InputBorder.none,
                          fillColor: Colors.transparent,
                          contentPadding: EdgeInsets.zero,
                        ),
                      ).animate().fade(delay: 200.ms),
                    ),
                    const SizedBox(height: 16),
                    _buildContextTags().animate().fade(delay: 300.ms),
                  ],
                  if (_remixSuggestion != null)
                    _buildRemixCard(),
                  _buildActionButtons(),
                ],
              ),
            ),
    );
  }

  // ── Full-screen AI Analysis Results ──
  Widget _buildAnalysisView() {
    final emotion = _aiAnalysis!.primaryEmotion;
    final intensity = _aiAnalysis!.intensityScore;
    final prompt = _aiAnalysis!.reflectionPrompt;
    final insight = _aiAnalysis!.awarenessInsight;
    final confidence = _aiAnalysis!.confidence;
    final method = _aiAnalysis!.method;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Non-clinical disclaimer
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            margin: const EdgeInsets.only(bottom: 16),
            decoration: BoxDecoration(
              color: AppTheme.warmGold.withValues(alpha: 0.08),
              borderRadius: BorderRadius.circular(8),
            ),
            child: const Text(
              "🛡️ This app helps you reflect — it is not a clinical diagnostic tool.",
              style: TextStyle(color: AppTheme.textSecondary, fontSize: 11),
              textAlign: TextAlign.center,
            ),
          ),
              ),
            ),
            
          // AI Explainability Layer (Probabilities)
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            margin: const EdgeInsets.only(bottom: 24),
            decoration: BoxDecoration(
              color: AppTheme.surfaceDarkElevated,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppTheme.surfaceDarkBorder),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('🧠 AI Analysis', style: TextStyle(color: AppTheme.textSecondary, fontSize: 12, fontWeight: FontWeight.w600)),
                    Text(method, style: const TextStyle(color: AppTheme.textSecondary, fontSize: 10, fontFamily: 'monospace')),
                  ]
                ),
                const SizedBox(height: 12),
                ..._aiAnalysis!.scores.entries.where((e) => e.value > 0.05).map((e) => 
                  Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: Row(
                      children: [
                        SizedBox(width: 80, child: Text(e.key.toUpperCase(), style: const TextStyle(color: AppTheme.textPrimary, fontSize: 11))),
                        Expanded(
                          child: ClipRRect(
                            borderRadius: BorderRadius.circular(4),
                            child: LinearProgressIndicator(
                              value: e.value.clamp(0.0, 1.0),
                              backgroundColor: AppTheme.backgroundDark,
                              color: _getEmotionColor(e.key),
                              minHeight: 6,
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        SizedBox(width: 40, child: Text('${(e.value * 100).toInt()}%', textAlign: TextAlign.right, style: TextStyle(color: _getEmotionColor(e.key), fontSize: 11, fontWeight: FontWeight.w700))),
                      ],
                    ),
                  )
                ),
              ],
            ),
          ).animate().fade(delay: 150.ms),
          
          // Header
          Center(
            child: Column(
              children: [
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: LinearGradient(
                      colors: [AppTheme.accent.withValues(alpha: 0.3), AppTheme.terracotta.withValues(alpha: 0.2)],
                    ),
                  ),
                  child: const Icon(Icons.psychology_alt_rounded, size: 48, color: AppTheme.accent),
                ),
                const SizedBox(height: 16),
                Text(
                  "Reflection Saved ✨",
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    color: AppTheme.accent,
                    letterSpacing: 1,
                  ),
                ),
              ],
            ),
          ).animate().fade().scale(begin: const Offset(0.9, 0.9)),
          const SizedBox(height: 32),

          // Detected Emotion Badge with Method + Confidence
          GlassContainer(
            baseColor: AppTheme.surfaceDarkElevated,
            borderColor: AppTheme.accent,
            borderRadius: BorderRadius.circular(20),
            padding: const EdgeInsets.all(20),
            child: Column(
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: AppTheme.accent.withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        _getEmotionEmoji(emotion),
                        style: const TextStyle(fontSize: 28),
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text("Detected Emotion", style: Theme.of(context).textTheme.bodyMedium),
                          const SizedBox(height: 4),
                          Text(
                            emotion,
                            style: Theme.of(context).textTheme.titleLarge?.copyWith(
                              color: AppTheme.accent,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ],
                      ),
                    ),
                    // Intensity Ring
                    SizedBox(
                      width: 52,
                      height: 52,
                      child: Stack(
                        alignment: Alignment.center,
                        children: [
                          CircularProgressIndicator(
                            value: intensity / 10,
                            strokeWidth: 4,
                            backgroundColor: AppTheme.surfaceDarkBorder,
                            color: _getIntensityColor(intensity),
                          ),
                          Text(
                            "$intensity",
                            style: Theme.of(context).textTheme.titleLarge?.copyWith(
                              color: _getIntensityColor(intensity),
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                // ── Method + Confidence disclosure ──
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  decoration: BoxDecoration(
                    color: AppTheme.surfaceDark,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppTheme.surfaceDarkBorder),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.info_outline_rounded, color: AppTheme.textSecondary, size: 16),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              _getConfidenceLabel(confidence),
                              style: TextStyle(
                                color: _getConfidenceColor(confidence),
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              "Method: TFLite Transformer (BERT)",
                              style: const TextStyle(color: AppTheme.textSecondary, fontSize: 10, fontFamily: 'monospace'),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              "🤖 AI-generated · on-device · evolving",
                              style: TextStyle(color: AppTheme.textSecondary.withValues(alpha: 0.6), fontSize: 9, fontStyle: FontStyle.italic),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                // ── Feedback Loop (Explainability) ──
                const SizedBox(height: 16),
                Container(
                   padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                   decoration: BoxDecoration(
                     color: AppTheme.surfaceDarkElevated.withValues(alpha: 0.5),
                     borderRadius: BorderRadius.circular(16),
                     border: Border.all(color: AppTheme.surfaceDarkBorder),
                   ),
                   child: Row(
                     mainAxisAlignment: MainAxisAlignment.spaceBetween,
                     children: [
                       const Text("Does this feel accurate?", style: TextStyle(color: AppTheme.textSecondary, fontSize: 13)),
                       Row(
                         children: [
                            IconButton(
                              icon: const Icon(Icons.thumb_up_alt_outlined, color: AppTheme.accent, size: 20),
                              onPressed: () {
                                 ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("Thanks! The AI is learning your emotional baseline.")));
                              },
                            ),
                            IconButton(
                              icon: const Icon(Icons.thumb_down_alt_outlined, color: AppTheme.terracotta, size: 20),
                              onPressed: () {
                                 _showCorrectionDialog(_aiAnalysis!.primaryEmotion);
                              },
                            ),
                         ],
                       )
                     ],
                   ),
                ).animate().fade().slideY(begin: 0.2),
                const SizedBox(height: 12),,
              ],
            ),
          ).animate().fade(delay: 200.ms).slideX(begin: -0.1),
          const SizedBox(height: 12),

          // ── Feedback Row: Was this accurate? ──
          _buildFeedbackRow(),

          // ── Vocabulary Note Chip ──
          if (_aiAnalysis!.vocabularyNote != null)
            GestureDetector(
              onTap: () => setState(() => _vocabularyExpanded = !_vocabularyExpanded),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 300),
                margin: const EdgeInsets.only(top: 10),
                padding: EdgeInsets.symmetric(horizontal: 14, vertical: _vocabularyExpanded ? 14 : 10),
                decoration: BoxDecoration(
                  color: AppTheme.warmGold.withValues(alpha: 0.08),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: AppTheme.warmGold.withValues(alpha: 0.3)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const Text('📖', style: TextStyle(fontSize: 14)),
                        const SizedBox(width: 8),
                        Text(
                          'Vocabulary Builder',
                          style: TextStyle(
                            color: AppTheme.warmGold,
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        const Spacer(),
                        Icon(
                          _vocabularyExpanded ? Icons.expand_less : Icons.expand_more,
                          color: AppTheme.warmGold,
                          size: 18,
                        ),
                      ],
                    ),
                    if (_vocabularyExpanded) ...[
                      const SizedBox(height: 8),
                      Text(
                        _aiAnalysis!.vocabularyNote!,
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: AppTheme.textSecondary,
                          height: 1.5,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ).animate().fade(delay: 350.ms),
          const SizedBox(height: 20),

          // Awareness Insight Card
          if (insight.isNotEmpty)
            GlassContainer(
              baseColor: AppTheme.deepOceanBlue.withValues(alpha: 0.1),
              borderColor: AppTheme.deepOceanBlue,
              borderRadius: BorderRadius.circular(20),
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.visibility_rounded, color: AppTheme.cyan, size: 20),
                      const SizedBox(width: 10),
                      Text(
                        "Awareness Insight",
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          color: AppTheme.cyan,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Text(
                    insight,
                    style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                      color: AppTheme.textPrimary,
                      height: 1.7,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    "(AI-generated reflection — not clinical advice)",
                    style: TextStyle(color: AppTheme.textSecondary.withValues(alpha: 0.6), fontSize: 10, fontStyle: FontStyle.italic),
                  ),
                ],
              ),
            ).animate().fade(delay: 400.ms).slideX(begin: 0.1),
          const SizedBox(height: 20),

          // Reflection Prompt
          if (prompt.isNotEmpty)
            GlassContainer(
              baseColor: AppTheme.warmGold.withValues(alpha: 0.05),
              borderColor: AppTheme.warmGold,
              borderRadius: BorderRadius.circular(20),
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.lightbulb_outline_rounded, color: AppTheme.warmGold, size: 20),
                      const SizedBox(width: 10),
                      Text(
                        "Reflection Prompt (Optional)",
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          color: AppTheme.warmGold,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Text(
                    prompt,
                    style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                      color: AppTheme.textPrimary,
                      height: 1.7,
                      fontStyle: FontStyle.italic,
                    ),
                  ),
                ],
              ),
            ).animate().fade(delay: 600.ms).slideY(begin: 0.1),
          const SizedBox(height: 20),

          // Supportive Lens
          if (_remixSuggestion != null)
            _buildRemixCard().animate().fade(delay: 800.ms).slideY(begin: 0.1),
          const SizedBox(height: 16),
          
          // Done Button
          Center(
            child: PrimaryButton(
              text: "Done",
              icon: Icons.check_rounded,
              onPressed: () => Navigator.of(context).pop(),
            ),
          ).animate().fade(delay: 1000.ms),
          const SizedBox(height: 32),
        ],
      ),
    );
  }

  Widget _buildRemixCard() {
    return Container(
      margin: const EdgeInsets.only(bottom: 16, top: 16),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            AppTheme.accent.withValues(alpha: 0.08),
            AppTheme.deepOceanBlue.withValues(alpha: 0.06),
          ],
        ),
        border: Border.all(color: AppTheme.accent.withValues(alpha: 0.3)),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.auto_awesome, color: AppTheme.accent, size: 20),
              const SizedBox(width: 10),
              Text(
                "Supportive Lens",
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  color: AppTheme.accent,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            _remixSuggestion!,
            style: Theme.of(context).textTheme.bodyLarge?.copyWith(
              color: AppTheme.textPrimary,
              height: 1.7,
            ),
          ),
        ],
      ),
    ).animate().fade().slideY(begin: 0.1);
  }

  Widget _buildContextTags() {
    return SizedBox(
      height: 48,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemCount: _availableTags.length + 1,
        separatorBuilder: (context, index) => const SizedBox(width: 8),
        itemBuilder: (context, index) {
          if (index == _availableTags.length) {
            return ActionChip(
              label: const Text(" + Custom Tag "),
              backgroundColor: AppTheme.surfaceDarkBorder.withValues(alpha: 0.5),
              labelStyle: const TextStyle(color: AppTheme.textSecondary),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(20),
                side: const BorderSide(color: Colors.transparent),
              ),
              onPressed: _showAddTagDialog,
            );
          }
          final tag = _availableTags[index];
          final isSelected = _selectedTags.contains(tag);
          return FilterChip(
            label: Text(tag),
            selected: isSelected,
            onSelected: (selected) {
              setState(() {
                if (selected) {
                  _selectedTags.add(tag);
                } else {
                  _selectedTags.remove(tag);
                }
              });
            },
            backgroundColor: AppTheme.surfaceDarkElevated,
            selectedColor: AppTheme.accent.withValues(alpha: 0.2),
            checkmarkColor: AppTheme.accent,
            labelStyle: TextStyle(
              color: isSelected ? AppTheme.accent : AppTheme.textSecondary,
              fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
            ),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(20),
              side: BorderSide(
                color: isSelected ? AppTheme.accent : AppTheme.surfaceDarkBorder,
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildActionButtons() {
    return Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.of(context).padding.bottom + 16, top: 16),
      child: Row(
        children: [
           Container(
             decoration: BoxDecoration(
               shape: BoxShape.circle,
               border: Border.all(color: AppTheme.surfaceDarkBorder, width: 2),
             ),
             child: IconButton(
                icon: _isRemixing 
                    ? const SizedBox(width: 22, height: 22, child: CircularProgressIndicator(strokeWidth: 2.5, color: AppTheme.textSecondary))
                    : const Icon(Icons.auto_awesome_rounded, size: 24),
                color: AppTheme.accent,
                onPressed: _isRemixing ? null : _handleRemix,
                tooltip: "Suggest a Supportive Lens",
             ),
           ),
           const SizedBox(width: 16),
           Expanded(
             child: PrimaryButton(
               text: "Save Reflection",
               icon: Icons.check_circle_outline,
               isLoading: _isSaving,
               onPressed: _handleSave,
             ),
           ),
        ],
      ),
    );
  }

  // ── Feedback Row: Thumbs Up/Down for adaptive learning ──
  Widget _buildFeedbackRow() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      decoration: BoxDecoration(
        color: AppTheme.surfaceDarkElevated,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppTheme.surfaceDarkBorder),
      ),
      child: Row(
        children: [
          const Icon(Icons.auto_awesome, size: 16, color: AppTheme.textSecondary),
          const SizedBox(width: 8),
          const Expanded(
            child: Text(
              "Was this accurate?",
              style: TextStyle(color: AppTheme.textSecondary, fontSize: 13),
            ),
          ),
          // Thumbs Up
          IconButton(
            onPressed: () {
              final localDb = ref.read(localStorageProvider);
              localDb.saveReflectionFeedback(
                emotion: _aiAnalysis!.primaryEmotion,
                reflectionText: _aiAnalysis!.reflectionPrompt,
                liked: true,
              );
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Thanks! Noted ✨'),
                  duration: Duration(seconds: 1),
                  backgroundColor: AppTheme.surfaceDarkElevated,
                ),
              );
            },
            icon: const Icon(Icons.thumb_up_outlined, size: 20),
            color: AppTheme.accent,
            tooltip: 'Accurate',
          ),
          // Thumbs Down → opens correction dialog
          IconButton(
            onPressed: () => _showCorrectionDialog(),
            icon: const Icon(Icons.thumb_down_outlined, size: 20),
            color: AppTheme.terracotta,
            tooltip: 'Not quite right — help me learn',
          ),
        ],
      ),
    ).animate().fade(delay: 300.ms);
  }

  void _showCorrectionDialog() {
    String? correctedEmotion;
    final emotions = ['Joy', 'Sadness', 'Anger', 'Apprehension', 'Fatigue', 'Contemplation'];

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) => AlertDialog(
          backgroundColor: AppTheme.surfaceDark,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          title: const Text(
            "Help MannMitra learn 🧠",
            style: TextStyle(color: AppTheme.textPrimary, fontSize: 18),
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                "I detected \"${_aiAnalysis!.primaryEmotion}\" — what were you actually feeling?",
                style: const TextStyle(color: AppTheme.textSecondary, fontSize: 14, height: 1.4),
              ),
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12),
                decoration: BoxDecoration(
                  color: AppTheme.surfaceDarkElevated,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppTheme.surfaceDarkBorder),
                ),
                child: DropdownButton<String>(
                  value: correctedEmotion,
                  hint: const Text("Select the correct emotion", style: TextStyle(color: AppTheme.textSecondary, fontSize: 14)),
                  dropdownColor: AppTheme.surfaceDark,
                  isExpanded: true,
                  underline: const SizedBox(),
                  items: emotions.map((e) => DropdownMenuItem(
                    value: e,
                    child: Text(e, style: const TextStyle(color: AppTheme.textPrimary)),
                  )).toList(),
                  onChanged: (val) => setDialogState(() => correctedEmotion = val),
                ),
              ),
              const SizedBox(height: 12),
              const Text(
                "Your corrections teach the model your personal vocabulary. After 5+ corrections per word, the model adapts. Learned weights decay slowly without reinforcement.",
                style: TextStyle(color: AppTheme.textSecondary, fontSize: 11, height: 1.4),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text("Cancel", style: TextStyle(color: AppTheme.textSecondary)),
            ),
            ElevatedButton(
              onPressed: correctedEmotion == null ? null : () {
                final localDb = ref.read(localStorageProvider);
                final triggerWords = _aiAnalysis!.triggers.map((t) => t.word).toList();
                localDb.saveCorrection(
                  entryId: _lastSavedEntryId ?? '',
                  originalEmotion: _aiAnalysis!.primaryEmotion,
                  correctedEmotion: correctedEmotion!,
                  triggerWords: triggerWords,
                );
                localDb.saveReflectionFeedback(
                  emotion: _aiAnalysis!.primaryEmotion,
                  reflectionText: _aiAnalysis!.reflectionPrompt,
                  liked: false,
                );
                Navigator.pop(ctx);
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('Thanks! MannMitra is learning 🧠'),
                    duration: Duration(seconds: 2),
                    backgroundColor: AppTheme.surfaceDarkElevated,
                  ),
                );
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.accent,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: const Text("Save Correction"),
            ),
          ],
        ),
      ),
    );
  }

  Color _getCategoryColor(String category) {
    switch (category) {
      case 'joy': return AppTheme.warmGold;
      case 'sadness': return AppTheme.cyan;
      case 'anger': return AppTheme.terracotta;
      case 'fear': return AppTheme.deepOceanBlue;
      case 'fatigue': return AppTheme.deepOceanBlue;
      default: return AppTheme.accent;
    }
  }

  String _getEmotionEmoji(String emotion) {
    final map = {
      'joy': '😊', 'sadness': '😢', 'anger': '😤', 'fear': '😰',
      'surprise': '😲', 'disgust': '🤢', 'apprehension': '😟',
      'contemplation': '🤔', 'ambivalence': '😶', 'introspection': '🧘',
      'fatigue': '😴', 'peaceful': '🌿', 'optimistic': '🌅',
    };
    return map[emotion.toLowerCase()] ?? '💭';
  }

  Color _getIntensityColor(int intensity) {
    if (intensity <= 3) return AppTheme.cyan;
    if (intensity <= 6) return AppTheme.warmGold;
    return AppTheme.terracotta;
  }

  /// Human-readable confidence label for the analysis UI.
  String _getConfidenceLabel(double confidence) {
    if (confidence >= 0.80) return "We're fairly sure (${confidence.toStringAsFixed(2)})";
    if (confidence >= 0.60) return "This might be (${confidence.toStringAsFixed(2)})";
    return "We could be wrong (${confidence.toStringAsFixed(2)})";
  }

  /// Color for the confidence label.
  Color _getConfidenceColor(double confidence) {
    if (confidence >= 0.80) return AppTheme.accent;
    if (confidence >= 0.60) return AppTheme.warmGold;
    return AppTheme.terracotta;
  }
}
