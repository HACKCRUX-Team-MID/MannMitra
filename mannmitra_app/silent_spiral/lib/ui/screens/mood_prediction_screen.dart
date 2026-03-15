import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:silent_spiral/core/theme.dart';
import 'package:silent_spiral/ui/widgets/glass_container.dart';
import 'package:silent_spiral/ui/widgets/custom_button.dart';

class MoodPredictionScreen extends ConsumerStatefulWidget {
  const MoodPredictionScreen({super.key});

  @override
  ConsumerState<MoodPredictionScreen> createState() => _MoodPredictionScreenState();
}

class _MoodPredictionScreenState extends ConsumerState<MoodPredictionScreen> {
  int _selectedDays = 14;
  bool _showManualEntry = false;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.bgDeep,
      appBar: AppBar(
        title: const Text("Mood Intelligence", style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildHeader(),
            const SizedBox(height: 24),
            _buildActionBar(),
            const SizedBox(height: 24),
            _buildLiveDeviceSensors(),
            if (_showManualEntry) ...[
              const SizedBox(height: 24),
              _buildManualEntryForm(),
            ],
            const SizedBox(height: 24),
            _buildMoodPredictionHero(),
            const SizedBox(height: 24),
            _buildConflictInsight(),
            const SizedBox(height: 24),
            _buildChartSection(
              title: "Self-Reported Mood Trend (Journaling)",
              icon: Icons.trending_up,
              color: AppTheme.accentPurple,
              dataKey: 'journal',
            ),
            const SizedBox(height: 24),
            _buildChartSection(
              title: "Behavior-Based Mood Prediction",
              icon: Icons.psychology,
              color: AppTheme.accentCyan,
              dataKey: 'behavior',
            ),
            const SizedBox(height: 24),
            _buildWeeklyWellnessScore(),
            const SizedBox(height: 48),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text("MOOD AI · BEHAVIORAL ANALYSIS", style: TextStyle(fontSize: 10, color: AppTheme.textMuted, fontWeight: FontWeight.w700, letterSpacing: 1.5)),
        const SizedBox(height: 8),
        Wrap(
          crossAxisAlignment: WrapCrossAlignment.end,
          children: [
            const Text("Your ", style: TextStyle(fontSize: 32, fontWeight: FontWeight.w800, color: AppTheme.textPrimary, letterSpacing: -1)),
            ShaderMask(
              shaderCallback: (b) => AppTheme.textGradient.createShader(b),
              child: const Text("Mood Intelligence", style: TextStyle(fontSize: 32, fontWeight: FontWeight.w800, color: Colors.white, letterSpacing: -1)),
            ),
          ],
        ),
        const SizedBox(height: 8),
        const Text("Comparing self-reported emotions with behavior-based predictions powered by the Dartmouth StudentLife research model.", style: TextStyle(color: AppTheme.textSecondary, fontSize: 13, height: 1.5)),
      ],
    );
  }

  Widget _buildActionBar() {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: [
          PrimaryButton(
            text: "Daily Check-in",
            icon: Icons.auto_awesome,
            onPressed: () {},
          ),
          const SizedBox(width: 8),
          GlassButton(
            text: "Manual Entry",
            icon: Icons.add,
            onPressed: () => setState(() => _showManualEntry = !_showManualEntry),
          ),
          const SizedBox(width: 8),
          Container(
             padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
             decoration: BoxDecoration(color: AppTheme.accentGreen.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(10), border: Border.all(color: AppTheme.accentGreen.withValues(alpha: 0.2))),
             child: const Row(
               children: [
                 Icon(Icons.monitor_heart, color: AppTheme.accentGreen, size: 16),
                 SizedBox(width: 6),
                 Text("Google Fit Connected", style: TextStyle(color: AppTheme.accentGreen, fontSize: 12, fontWeight: FontWeight.w600)),
               ],
             )
          ),
          const SizedBox(width: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(color: AppTheme.bgCard, borderRadius: BorderRadius.circular(12), border: Border.all(color: AppTheme.glassBorder)),
            child: DropdownButtonHideUnderline(
              child: DropdownButton<int>(
                value: _selectedDays,
                isDense: true,
                dropdownColor: AppTheme.bgDeep,
                icon: const Icon(Icons.arrow_drop_down, color: AppTheme.textPrimary),
                style: const TextStyle(color: AppTheme.textPrimary, fontSize: 13, fontWeight: FontWeight.w600),
                onChanged: (v) {
                  if (v != null) setState(() => _selectedDays = v);
                },
                items: const [
                  DropdownMenuItem(value: 7, child: Text("7 Days")),
                  DropdownMenuItem(value: 14, child: Text("14 Days")),
                  DropdownMenuItem(value: 30, child: Text("30 Days")),
                ],
              ),
            ),
          )
        ],
      ),
    );
  }

  Widget _buildLiveDeviceSensors() {
    return GlassContainer(
      type: GlassType.card,
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(width: 8, height: 8, decoration: BoxDecoration(color: AppTheme.accentGreen, shape: BoxShape.circle, boxShadow: [BoxShadow(color: AppTheme.accentGreen.withValues(alpha: 0.5), blurRadius: 8)])),
              const SizedBox(width: 8),
              const Text("LIVE DEVICE SENSORS — AUTO-DETECTED", style: TextStyle(color: AppTheme.textMuted, fontSize: 10, fontWeight: FontWeight.w700, letterSpacing: 1)),
            ],
          ),
          const SizedBox(height: 20),
          LayoutBuilder(
            builder: (context, constraints) {
              final w = constraints.maxWidth / 2 - 8;
              return Wrap(
                spacing: 16, runSpacing: 20,
                children: [
                  _buildSensorItem("5,230", "Steps (Accelerometer)", AppTheme.accentGreen, w),
                  _buildSensorItem("240m", "App Screen Time", AppTheme.accentPurple, w),
                  _buildSensorItem("Moderate", "Activity Level", AppTheme.accentYellow, w),
                  _buildSensorItem("✅ No", "Late Night Usage", AppTheme.accentGreen, w),
                ],
              );
            }
          ),
          const SizedBox(height: 20),
          Row(
             children: [
               GlassButton(text: "Enable Step Tracking", icon: Icons.directions_walk, onPressed: (){}),
               const SizedBox(width: 12),
               const Expanded(child: Text("Step tracking requires motion sensor permission", style: TextStyle(color: AppTheme.textMuted, fontSize: 11)))
             ],
          )
        ],
      ),
    );
  }

  Widget _buildSensorItem(String val, String label, Color color, double width) {
    return SizedBox(
      width: width,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Text(val, style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: color)),
          const SizedBox(height: 4),
          Text(label, style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary, fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }

  Widget _buildManualEntryForm() {
    return GlassContainer(
      type: GlassType.card,
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
               Icon(Icons.add, color: AppTheme.accentPurple, size: 18),
               SizedBox(width: 8),
               Text("Manual Behavioral Data Entry", style: TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
            ],
          ),
          const SizedBox(height: 16),
          _buildSliderField("Sleep Hours", 7.5, 14, "h"),
          const SizedBox(height: 12),
          _buildSliderField("Steps", 5000, 20000, ""),
          const SizedBox(height: 12),
          _buildSliderField("Screen Time", 4.5, 12, "h"),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.end,
            children: [
              GlassButton(text: "Cancel", onPressed: () => setState((){ _showManualEntry = false; })),
              const SizedBox(width: 12),
              PrimaryButton(text: "Save Record", onPressed: () => setState((){ _showManualEntry = false; })),
            ]
          )
        ],
      ),
    );
  }

  Widget _buildSliderField(String label, double val, double max, String unit) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text("$label: ${val.toStringAsFixed(1)}$unit", style: const TextStyle(color: AppTheme.textSecondary, fontSize: 12, fontWeight: FontWeight.w600)),
        SliderTheme(
          data: SliderTheme.of(context).copyWith(
            activeTrackColor: AppTheme.accentPurple,
            inactiveTrackColor: Colors.white10,
            thumbColor: Colors.white,
            trackHeight: 4,
          ),
          child: Slider(value: val, max: max, onChanged: (v){})
        )
      ],
    );
  }

  Widget _buildMoodPredictionHero() {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: const LinearGradient(colors: [Color.fromRGBO(168, 85, 247, 0.05), Color.fromRGBO(34, 211, 238, 0.05)]),
        border: Border.all(color: const Color.fromRGBO(168, 85, 247, 0.15)),
        borderRadius: BorderRadius.circular(24),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
             mainAxisAlignment: MainAxisAlignment.spaceBetween,
             crossAxisAlignment: CrossAxisAlignment.start,
             children: [
               Expanded(
                 child: Column(
                   crossAxisAlignment: CrossAxisAlignment.start,
                   children: [
                     const Row(
                       children: [
                         Icon(Icons.psychology, size: 14, color: AppTheme.textSecondary),
                         SizedBox(width: 6),
                         Text("AI Mood Prediction", style: TextStyle(color: AppTheme.textSecondary, fontSize: 12, fontWeight: FontWeight.w600)),
                       ],
                     ),
                     const SizedBox(height: 8),
                     ShaderMask(
                       shaderCallback: (b) => AppTheme.textGradient.createShader(b),
                       child: const Text("Calm", style: TextStyle(fontSize: 32, fontWeight: FontWeight.w800, color: Colors.white, letterSpacing: -1)),
                     ),
                     const Text("Based on your latest behavioral signals (StudentLife model)", style: TextStyle(color: AppTheme.textSecondary, fontSize: 12)),
                   ],
                 ),
               ),
               Column(
                 crossAxisAlignment: CrossAxisAlignment.end,
                 children: [
                   ShaderMask(
                     shaderCallback: (b) => AppTheme.textGradient.createShader(b),
                     child: const Text("7.5", style: TextStyle(fontSize: 36, fontWeight: FontWeight.w800, color: Colors.white)),
                   ),
                   const Text("Mood Score / 10", style: TextStyle(color: AppTheme.textSecondary, fontSize: 11)),
                 ],
               )
             ],
          ),
          const SizedBox(height: 24),
          Wrap(
            spacing: 8, runSpacing: 8,
            children: [
              _buildMoodBadge("Calm", "😌", 0.65, AppTheme.accentGreen),
              _buildMoodBadge("Energetic", "⚡", 0.20, AppTheme.accentYellow),
              _buildMoodBadge("Tired", "😴", 0.10, AppTheme.accentPurple),
              _buildMoodBadge("Stressed", "😰", 0.05, AppTheme.emotionStress),
            ],
          )
        ],
      ),
    );
  }

  Widget _buildMoodBadge(String label, String emoji, double prob, Color c) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(color: c.withValues(alpha: 0.12), border: Border.all(color: c.withValues(alpha: 0.25)), borderRadius: BorderRadius.circular(12)),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(emoji, style: const TextStyle(fontSize: 18)),
          const SizedBox(width: 8),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label, style: TextStyle(color: c, fontWeight: FontWeight.w700, fontSize: 12)),
              Text("${(prob * 100).toInt()}%", style: const TextStyle(color: AppTheme.textMuted, fontSize: 10)),
            ],
          ),
          const SizedBox(width: 12),
          Container(
             width: 40, height: 4,
             decoration: BoxDecoration(color: c.withValues(alpha: 0.2), borderRadius: BorderRadius.circular(4)),
             child: FractionallySizedBox(
               alignment: Alignment.centerLeft,
               widthFactor: prob,
               child: Container(decoration: BoxDecoration(color: c, borderRadius: BorderRadius.circular(4))),
             ),
          )
        ],
      )
    );
  }

  Widget _buildConflictInsight() {
    return Container(
       padding: const EdgeInsets.all(16),
       decoration: BoxDecoration(color: AppTheme.accentYellow.withValues(alpha: 0.06), border: Border.all(color: AppTheme.accentYellow.withValues(alpha: 0.3)), borderRadius: BorderRadius.circular(16)),
       child: Row(
         crossAxisAlignment: CrossAxisAlignment.start,
         children: [
           Container(
             width: 40, height: 40,
             decoration: BoxDecoration(color: AppTheme.accentYellow.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(12)),
             child: const Icon(Icons.warning_amber_rounded, color: AppTheme.accentYellow, size: 20),
           ),
           const SizedBox(width: 16),
           const Expanded(
             child: Column(
               crossAxisAlignment: CrossAxisAlignment.start,
               children: [
                 Text("Mood Conflict Detected", style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14)),
                 SizedBox(height: 4),
                 Text("You reported feeling 'Stressed' in your journal, but your behavioral signals (high sleep, moderate activity) suggest a 'Calm' baseline. Often, physical rest hasn't caught up to mental load.", style: TextStyle(color: AppTheme.textSecondary, fontSize: 13, height: 1.5)),
               ],
             ),
           )
         ],
       ),
    );
  }

  Widget _buildChartSection({required String title, required IconData icon, required Color color, required String dataKey}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(icon, size: 14, color: AppTheme.textSecondary),
            const SizedBox(width: 6),
            Text(title, style: const TextStyle(color: AppTheme.textSecondary, fontSize: 13, fontWeight: FontWeight.w600)),
          ],
        ),
        const SizedBox(height: 12),
        GlassContainer(
          type: GlassType.card,
          padding: const EdgeInsets.all(20),
          child: SizedBox(
            height: 200,
            child: LineChart(
              LineChartData(
                gridData: FlGridData(show: true, drawVerticalLine: false, getDrawingHorizontalLine: (v) => FlLine(color: Colors.white10, strokeWidth: 1)),
                titlesData: FlTitlesData(
                  leftTitles: AxisTitles(sideTitles: SideTitles(showTitles: true, reservedSize: 24, getTitlesWidget: (v, m) => Text(v.toInt().toString(), style: const TextStyle(color: AppTheme.textMuted, fontSize: 10)))),
                  bottomTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                  topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                  rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                ),
                borderData: FlBorderData(show: false),
                minY: 0, maxY: 10,
                lineBarsData: [
                  LineChartBarData(
                    spots: const [FlSpot(0, 5), FlSpot(1, 4), FlSpot(2, 6), FlSpot(3, 8), FlSpot(4, 7), FlSpot(5, 7.5)],
                    isCurved: true,
                    color: color,
                    barWidth: 3,
                    dotData: FlDotData(show: true, getDotPainter: (spot, percent, data, index) => FlDotCirclePainter(radius: 4, color: Colors.white, strokeColor: color, strokeWidth: 2)),
                    belowBarData: BarAreaData(show: true, color: color.withValues(alpha: 0.15)),
                  )
                ],
                extraLinesData: ExtraLinesData(
                  horizontalLines: [
                    HorizontalLine(y: 5, color: Colors.white10, strokeWidth: 1, dashArray: [5, 5], label: HorizontalLineLabel(show: true, alignment: Alignment.bottomRight, style: const TextStyle(color: AppTheme.textMuted, fontSize: 10), labelResolver: (line) => 'Neutral')),
                  ]
                )
              )
            )
          )
        )
      ],
    );
  }

  Widget _buildWeeklyWellnessScore() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Row(
          children: [
            Icon(Icons.auto_awesome, size: 14, color: AppTheme.textSecondary),
            SizedBox(width: 6),
            Text("Weekly Wellness Score", style: TextStyle(color: AppTheme.textSecondary, fontSize: 13, fontWeight: FontWeight.w600)),
          ],
        ),
        const SizedBox(height: 12),
        GlassContainer(
          type: GlassType.card,
          padding: const EdgeInsets.all(24),
          child: Container(
            decoration: BoxDecoration(gradient: const LinearGradient(colors: [Color.fromRGBO(168, 85, 247, 0.04), Color.fromRGBO(16, 185, 129, 0.04)]), borderRadius: BorderRadius.circular(16)),
            child: Row(
              children: [
                Stack(
                  alignment: Alignment.center,
                  children: [
                    SizedBox(
                      width: 90, height: 90,
                      child: CircularProgressIndicator(value: 0.78, color: AppTheme.accentGreen, backgroundColor: Colors.white10, strokeWidth: 6, strokeCap: StrokeCap.round),
                    ),
                    const Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text("B+", style: TextStyle(fontSize: 24, fontWeight: FontWeight.w800, color: AppTheme.accentGreen, letterSpacing: -1)),
                        Text("78/100", style: TextStyle(fontSize: 10, color: AppTheme.textMuted, fontWeight: FontWeight.w600)),
                      ],
                    )
                  ],
                ),
                const SizedBox(width: 24),
                Expanded(
                  child: Column(
                    children: [
                      _buildWellnessSubScore("🌙 Sleep", 65, AppTheme.accentYellow),
                      const SizedBox(height: 10),
                      _buildWellnessSubScore("🏃 Activity", 82, AppTheme.accentGreen),
                      const SizedBox(height: 10),
                      _buildWellnessSubScore("📱 Screen Balance", 45, AppTheme.emotionStress),
                      const SizedBox(height: 10),
                      _buildWellnessSubScore("📊 Consistency", 90, AppTheme.accentGreen),
                    ],
                  ),
                )
              ],
            ),
          )
        )
      ],
    );
  }

  Widget _buildWellnessSubScore(String label, double score, Color c) {
    return Row(
      children: [
        Expanded(
          flex: 2,
          child: Text(label, style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary, fontWeight: FontWeight.w600)),
        ),
        Expanded(
          flex: 3,
          child: Row(
            children: [
               Expanded(
                 child: ClipRRect(
                   borderRadius: BorderRadius.circular(4),
                   child: LinearProgressIndicator(value: score / 100, backgroundColor: Colors.white10, valueColor: AlwaysStoppedAnimation(c), minHeight: 4),
                 ),
               ),
               const SizedBox(width: 8),
               SizedBox(
                 width: 32,
                 child: Text("${score.toInt()}%", style: TextStyle(color: c, fontSize: 11, fontWeight: FontWeight.w700), textAlign: TextAlign.right),
               )
            ],
          )
        )
      ],
    );
  }
}
