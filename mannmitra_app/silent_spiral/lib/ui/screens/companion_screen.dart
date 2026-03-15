import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:speech_to_text/speech_to_text.dart' as stt;
import 'package:silent_spiral/core/theme.dart';
import 'package:silent_spiral/services/llm_service.dart';
import 'package:silent_spiral/ui/widgets/glass_container.dart';

class CompanionMessage {
  final String id;
  final String role; // 'user' | 'companion'
  final String text;
  final String? emotion;
  final DateTime timestamp;

  CompanionMessage({
    required this.id,
    required this.role,
    required this.text,
    this.emotion,
    required this.timestamp,
  });
}

class CompanionScreen extends ConsumerStatefulWidget {
  const CompanionScreen({super.key});

  @override
  ConsumerState<CompanionScreen> createState() => _CompanionScreenState();
}

class _CompanionScreenState extends ConsumerState<CompanionScreen> {
  final TextEditingController _inputController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  
  List<CompanionMessage> _messages = [];
  bool _isTyping = false;
  bool _isRecording = false;
  String _lastEmotion = 'neutral';
  
  final stt.SpeechToText _speech = stt.SpeechToText();

  @override
  void initState() {
    super.initState();
    _initSpeech();
    _messages.add(CompanionMessage(
      id: 'greeting',
      role: 'companion',
      text: "Hi there. I'm here to listen. How are you feeling today?",
      timestamp: DateTime.now(),
    ));
  }

  @override
  void dispose() {
    _inputController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  Future<void> _initSpeech() async {
    await _speech.initialize();
  }

  void _scrollToBottom() {
    if (_scrollController.hasClients) {
      _scrollController.animateTo(
        _scrollController.position.maxScrollExtent + 200,
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeOut,
      );
    }
  }

  void _handleSend([String? textArg]) async {
    final text = textArg ?? _inputController.text.trim();
    if (text.isEmpty) return;

    final userMsg = CompanionMessage(
      id: 'user-${DateTime.now().millisecondsSinceEpoch}',
      role: 'user',
      text: text,
      timestamp: DateTime.now(),
    );

    setState(() {
      _messages.add(userMsg);
      _inputController.clear();
      _isTyping = true;
    });

    Future.delayed(const Duration(milliseconds: 100), _scrollToBottom);

    // AI logic via LLMService
    final llmService = ref.read(llmServiceProvider);
    
    // Slight delay to simulate thinking
    final delay = 800 + (DateTime.now().millisecondsSinceEpoch % 1200);
    await Future.delayed(Duration(milliseconds: delay));

    if (!mounted) return;

    // Detect emotion natively
    final analysis = llmService.analyzeEntry(text);
    _lastEmotion = analysis.primaryEmotion;

    // Generate response using remix
    final response = llmService.generateRemix(text)
        .replaceAll(RegExp(r'\[.*?\] '), ''); // Strip the [Perspective] tags for chat

    final companionMsg = CompanionMessage(
      id: 'companion-${DateTime.now().millisecondsSinceEpoch}',
      role: 'companion',
      text: response,
      emotion: analysis.primaryEmotion,
      timestamp: DateTime.now(),
    );

    setState(() {
      _messages.add(companionMsg);
      _isTyping = false;
    });

    Future.delayed(const Duration(milliseconds: 100), _scrollToBottom);
  }

  void _toggleRecording() async {
    if (_isRecording) {
      _speech.stop();
      setState(() => _isRecording = false);
    } else {
      bool available = await _speech.initialize();
      if (available) {
        setState(() => _isRecording = true);
        _speech.listen(onResult: (val) {
          setState(() {
            _inputController.text = val.recognizedWords;
          });
        });
      }
    }
  }

  List<String> get _quickReplies {
    if (_messages.length <= 1) {
      return ['I feel stressed lately', 'I need someone to talk to', 'How can I feel better?', 'I feel great today!'];
    }
    return ['Tell me more', 'What should I do?', 'I want to reflect', 'Thank you'];
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.bgDeep, // Matching dark theme
      body: SafeArea(
        child: Column(
          children: [
            _buildHeader(),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                child: GlassContainer(
                  type: GlassType.card,
                  padding: EdgeInsets.zero,
                  child: Column(
                    children: [
                      Expanded(
                        child: ListView.builder(
                          controller: _scrollController,
                          padding: const EdgeInsets.all(24),
                          itemCount: _messages.length + (_isTyping ? 1 : 0),
                          itemBuilder: (context, index) {
                            if (index == _messages.length && _isTyping) {
                               return _buildTypingIndicator();
                            }
                            return _buildMessage(_messages[index]);
                          },
                        ),
                      ),
                      _buildQuickReplies(),
                      if (_messages.where((m) => m.role == 'user').length >= 2)
                        _buildGenerateJournalButton(),
                      _buildInputArea(),
                    ],
                  ),
                ),
              ),
            ),
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 12),
              child: Text(
                "🔒 All conversations are processed on your device. This is a reflection tool, not a substitute for professional help.",
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 10, color: AppTheme.textMuted, fontStyle: FontStyle.italic),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(24, 24, 24, 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            "AI REFLECTION COMPANION",
            style: TextStyle(fontSize: 10, color: AppTheme.textMuted, fontWeight: FontWeight.w700, letterSpacing: 1.5),
          ),
          const SizedBox(height: 8),
          Row(
            children: [
               ShaderMask(
                 shaderCallback: (b) => AppTheme.textGradient.createShader(b),
                 child: const Text("MannMitra", style: TextStyle(fontSize: 28, fontWeight: FontWeight.w800, color: Colors.white)),
               ),
               const SizedBox(width: 8),
               Flexible(
                 child: Container(
                   padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                   decoration: BoxDecoration(
                     color: AppTheme.accentPurple.withValues(alpha: 0.1),
                     borderRadius: BorderRadius.circular(8),
                     border: Border.all(color: AppTheme.accentPurple.withValues(alpha: 0.2)),
                   ),
                   child: const Text("Reflection Only", style: TextStyle(color: AppTheme.accentPurple, fontSize: 10, fontWeight: FontWeight.w600), overflow: TextOverflow.ellipsis),
                 ),
               )
            ],
          ),
          const SizedBox(height: 4),
          Row(
            children: [
              const Text("A safe space to explore your thoughts.", style: TextStyle(color: AppTheme.textSecondary, fontSize: 13)),
              const SizedBox(width: 8),
              const Icon(Icons.psychology, size: 14, color: AppTheme.accentGreen),
              const SizedBox(width: 4),
              const Text("NLP Active", style: TextStyle(color: AppTheme.accentGreen, fontSize: 11, fontWeight: FontWeight.w600)),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildMessage(CompanionMessage msg) {
    final isUser = msg.role == 'user';
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Row(
        mainAxisAlignment: isUser ? MainAxisAlignment.end : MainAxisAlignment.start,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          if (!isUser) // Companion Avatar
            Container(
              width: 32, height: 32,
              decoration: const BoxDecoration(
                shape: BoxShape.circle,
                gradient: LinearGradient(colors: [AppTheme.accentPurple, AppTheme.accentCyan]),
              ),
              child: const Icon(Icons.smart_toy_rounded, color: Colors.white, size: 16),
            ),
          if (!isUser) const SizedBox(width: 12),
          
          Flexible(
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
              decoration: BoxDecoration(
                gradient: isUser ? const LinearGradient(colors: [AppTheme.accentPurple, Color(0xFF8B5CF6)]) : null,
                color: isUser ? null : Colors.black.withValues(alpha: 0.2), // AppTheme.bgCard equivalent
                borderRadius: BorderRadius.only(
                  topLeft: const Radius.circular(16),
                  topRight: const Radius.circular(16),
                  bottomLeft: Radius.circular(isUser ? 16 : 4),
                  bottomRight: Radius.circular(isUser ? 4 : 16),
                ),
                boxShadow: isUser ? [BoxShadow(color: AppTheme.accentPurple.withValues(alpha: 0.25), blurRadius: 12, offset: const Offset(0, 2))] : null,
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    msg.text,
                    style: TextStyle(
                      color: isUser ? Colors.white : AppTheme.textPrimary,
                      fontSize: 14.5,
                      height: 1.5,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  if (msg.emotion != null && !isUser)
                    Padding(
                      padding: const EdgeInsets.only(top: 6),
                      child: Text("Detected: ${msg.emotion}", style: const TextStyle(fontSize: 10, color: AppTheme.textMuted, fontStyle: FontStyle.italic)),
                    )
                ],
              ),
            ),
          ),
          
          if (isUser) const SizedBox(width: 12),
          if (isUser) // User Avatar
            Container(
              width: 32, height: 32,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: Colors.white.withValues(alpha: 0.1),
              ),
              child: const Icon(Icons.person, color: AppTheme.textMuted, size: 16),
            ),
        ],
      ),
    ).animate().fade().slideY(begin: 0.05);
  }

  Widget _buildTypingIndicator() {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          Container(
            width: 32, height: 32,
            decoration: const BoxDecoration(
              shape: BoxShape.circle,
              gradient: LinearGradient(colors: [AppTheme.accentPurple, AppTheme.accentCyan]),
            ),
            child: const Icon(Icons.smart_toy_rounded, color: Colors.white, size: 16),
          ),
          const SizedBox(width: 12),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
            decoration: BoxDecoration(
              color: Colors.black.withValues(alpha: 0.2),
              borderRadius: const BorderRadius.only(
                topLeft: Radius.circular(16),
                topRight: Radius.circular(16),
                bottomLeft: Radius.circular(4),
                bottomRight: Radius.circular(16),
              ),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                _buildDot(0),
                const SizedBox(width: 4),
                _buildDot(150),
                const SizedBox(width: 4),
                _buildDot(300),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDot(int delay) {
    return Container(
      width: 6, height: 6,
      decoration: BoxDecoration(color: AppTheme.accentPurple.withValues(alpha: 0.6), shape: BoxShape.circle),
    ).animate(onPlay: (controller) => controller.repeat()).moveY(begin: 0, end: -4, duration: 600.ms, delay: delay.ms).then().moveY(begin: -4, end: 0, duration: 600.ms);
  }

  Widget _buildQuickReplies() {
    return Container(
      height: 48,
      decoration: const BoxDecoration(border: Border(top: BorderSide(color: Colors.white10))),
      child: ListView.separated(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
        scrollDirection: Axis.horizontal,
        itemCount: _quickReplies.length,
        separatorBuilder: (_, __) => const SizedBox(width: 8),
        itemBuilder: (context, index) {
          return GestureDetector(
            onTap: _isTyping ? null : () => _handleSend(_quickReplies[index]),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
              decoration: BoxDecoration(
                color: AppTheme.accentPurple.withValues(alpha: 0.07),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: AppTheme.accentPurple.withValues(alpha: 0.15)),
              ),
              child: Center(
                child: Text(
                  _quickReplies[index],
                  style: TextStyle(color: AppTheme.accentPurple.withValues(alpha: _isTyping ? 0.5 : 1), fontSize: 12, fontWeight: FontWeight.w600),
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildGenerateJournalButton() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
      decoration: const BoxDecoration(border: Border(top: BorderSide(color: Colors.white10))),
      child: GestureDetector(
        onTap: () {
           // Would navigate to Journal screen passing texts, in real app.
           ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("Journal generation triggered")));
        },
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 12),
          decoration: BoxDecoration(
            gradient: LinearGradient(colors: [AppTheme.accentPurple.withValues(alpha: 0.1), AppTheme.accentCyan.withValues(alpha: 0.08)]),
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: AppTheme.accentPurple.withValues(alpha: 0.2)),
          ),
          child: const Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text("✍️", style: TextStyle(fontSize: 14)),
              SizedBox(width: 8),
              Text("Generate Journal Entry from this conversation", style: TextStyle(color: AppTheme.accentPurple, fontWeight: FontWeight.w700, fontSize: 12)),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildInputArea() {
    return Container(
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 12),
      decoration: const BoxDecoration(border: Border(top: BorderSide(color: Colors.white10))),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          GestureDetector(
            onTap: _toggleRecording,
            child: Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: _isRecording ? AppTheme.emotionStress.withValues(alpha: 0.15) : Colors.white.withValues(alpha: 0.05),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: _isRecording ? AppTheme.emotionStress.withValues(alpha: 0.3) : Colors.white10),
              ),
              child: Icon(_isRecording ? Icons.mic_off : Icons.mic, size: 20, color: _isRecording ? AppTheme.emotionStress : AppTheme.textMuted),
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.04),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.white10),
              ),
              child: TextField(
                controller: _inputController,
                maxLines: 4,
                minLines: 1,
                style: const TextStyle(color: AppTheme.textPrimary, fontSize: 14),
                decoration: const InputDecoration(
                  hintText: "Share what's on your mind...",
                  hintStyle: TextStyle(color: AppTheme.textMuted),
                  border: InputBorder.none,
                ),
                onChanged: (_) => setState(() {}),
                onSubmitted: (_) => _handleSend(),
              ),
            ),
          ),
          const SizedBox(width: 8),
          GestureDetector(
            onTap: (_inputController.text.trim().isEmpty || _isTyping) ? null : () => _handleSend(),
            child: Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                gradient: (_inputController.text.trim().isEmpty || _isTyping) ? null : const LinearGradient(colors: [AppTheme.accentPurple, Color(0xFF8B5CF6)]),
                color: (_inputController.text.trim().isEmpty || _isTyping) ? Colors.white.withValues(alpha: 0.08) : null,
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(Icons.send_rounded, size: 20, color: (_inputController.text.trim().isEmpty || _isTyping) ? AppTheme.textMuted : Colors.white),
            ),
          ),
        ],
      ),
    );
  }
}
