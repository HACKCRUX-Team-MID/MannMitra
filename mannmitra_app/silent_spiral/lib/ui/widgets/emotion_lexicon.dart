import 'package:flutter/material.dart';
import 'package:silent_spiral/core/theme.dart';
import 'package:flutter_animate/flutter_animate.dart';

class EmotionLexicon extends StatefulWidget {
  final Function(String) onEmotionSelected;

  const EmotionLexicon({super.key, required this.onEmotionSelected});

  @override
  State<EmotionLexicon> createState() => _EmotionLexiconState();
}

class _EmotionLexiconState extends State<EmotionLexicon> {
  // Root emotions with emojis
  final Map<String, Map<String, dynamic>> _emotionMap = {
    '😊 Joy': {
      'emoji': '😊',
      'color': const Color(0xFFFFD54F),
      'children': ['🌿 Peaceful', '🌅 Optimistic', '🏆 Proud', '😌 Relieved', '🕊️ Content'],
    },
    '😢 Sadness': {
      'emoji': '😢',
      'color': const Color(0xFF80DEEA),
      'children': ['🫂 Lonely', '💧 Vulnerable', '🌑 Despair', '😔 Guilty', '💔 Disappointed'],
    },
    '😰 Fear': {
      'emoji': '😰',
      'color': const Color(0xFFCE93D8),
      'children': ['😟 Anxious', '🫣 Insecure', '🌊 Overwhelmed', '😮‍💨 Worried', '🕳️ Dread'],
    },
    '😤 Anger': {
      'emoji': '😤',
      'color': const Color(0xFFFF8A80),
      'children': ['😩 Frustrated', '💢 Resentful', '😒 Annoyed', '🗡️ Betrayed', '🔥 Irritated'],
    },
    '😲 Surprise': {
      'emoji': '😲',
      'color': const Color(0xFFB388FF),
      'children': ['🤯 Confused', '✨ Amazed', '😵 Overcome', '⚡ Stunned'],
    },
    '🤢 Disgust': {
      'emoji': '🤢',
      'color': const Color(0xFFA5D6A7),
      'children': ['🧐 Judgmental', '😱 Appalled', '🫥 Revolted', '🚫 Averse'],
    },
  };

  String? _selectedRoot;
  String? _selectedGranular;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 8.0, vertical: 8.0),
          child: Text(
            "What feels true right now?",
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
              color: AppTheme.textSecondary,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
        SizedBox(
          height: 52,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 8),
            itemCount: _emotionMap.keys.length,
            itemBuilder: (context, index) {
              final root = _emotionMap.keys.elementAt(index);
              final isSelected = _selectedRoot == root;
              final data = _emotionMap[root]!;
              final Color chipColor = data['color'] as Color;
              return Padding(
                padding: const EdgeInsets.symmetric(horizontal: 4.0),
                child: ChoiceChip(
                  label: Text(root, style: const TextStyle(fontSize: 14)),
                  selected: isSelected,
                  onSelected: (selected) {
                    setState(() {
                      _selectedRoot = selected ? root : null;
                      _selectedGranular = null;
                    });
                  },
                  backgroundColor: AppTheme.surfaceDarkElevated,
                  selectedColor: chipColor.withValues(alpha: 0.25),
                  labelStyle: TextStyle(
                    color: isSelected ? chipColor : AppTheme.textPrimary,
                    fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                  ),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(20),
                    side: BorderSide(
                      color: isSelected ? chipColor : AppTheme.surfaceDarkBorder,
                      width: isSelected ? 2 : 1,
                    ),
                  ),
                  elevation: isSelected ? 4 : 0,
                  pressElevation: 2,
                ),
              ).animate().fade(delay: (index * 60).ms).slideX(begin: 0.15);
            },
          ),
        ),
        if (_selectedRoot != null) ...[
          const SizedBox(height: 12),
          SizedBox(
            height: 44,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 8),
              itemCount: (_emotionMap[_selectedRoot]!['children'] as List<String>).length,
              itemBuilder: (context, index) {
                final children = _emotionMap[_selectedRoot]!['children'] as List<String>;
                final granular = children[index];
                final isSelected = _selectedGranular == granular;
                final Color parentColor = _emotionMap[_selectedRoot]!['color'] as Color;
                return Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 4.0),
                  child: ActionChip(
                    label: Text(granular, style: const TextStyle(fontSize: 13)),
                    onPressed: () {
                      setState(() => _selectedGranular = granular);
                      // Strip emoji for the callback
                      final cleanName = granular.replaceAll(RegExp(r'[^\w\s]'), '').trim();
                      widget.onEmotionSelected(cleanName);
                    },
                    backgroundColor: isSelected ? parentColor.withValues(alpha: 0.25) : AppTheme.surfaceDarkElevated,
                    labelStyle: TextStyle(
                      color: isSelected ? parentColor : AppTheme.textPrimary,
                      fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
                    ),
                    side: BorderSide(
                      color: isSelected ? parentColor : AppTheme.surfaceDarkBorder,
                    ),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  ),
                ).animate().fade().slideX(begin: 0.2, delay: (index * 50).ms);
              },
            ),
          ),
        ],
      ],
    );
  }
}
