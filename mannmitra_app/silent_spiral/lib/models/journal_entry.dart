import 'package:hive/hive.dart';
class JournalEntry extends HiveObject {

  final String id;

  @HiveField(1)
  final String text;

  @HiveField(2)
  final DateTime timestamp;

  @HiveField(3)
  final String? primaryEmotion;

  @HiveField(4)
  final int? intensityScore;

  @HiveField(5)
  final String? reflectionPrompt;

  @HiveField(6)
  final List<String>? remixes;

  JournalEntry({
    required this.id,
    required this.text,
    required this.timestamp,
    this.primaryEmotion,
    this.intensityScore,
    this.reflectionPrompt,
    this.remixes,
  });

  JournalEntry copyWith({
    String? id,
    String? text,
    DateTime? timestamp,
    String? primaryEmotion,
    int? intensityScore,
    String? reflectionPrompt,
    List<String>? remixes,
  }) {
    return JournalEntry(
      id: id ?? this.id,
      text: text ?? this.text,
      timestamp: timestamp ?? this.timestamp,
      primaryEmotion: primaryEmotion ?? this.primaryEmotion,
      intensityScore: intensityScore ?? this.intensityScore,
      reflectionPrompt: reflectionPrompt ?? this.reflectionPrompt,
      remixes: remixes ?? this.remixes,
    );
  }
}

class JournalEntryAdapter extends TypeAdapter<JournalEntry> {
  @override
  final int typeId = 0;

  @override
  JournalEntry read(BinaryReader reader) {
    var numOfFields = reader.readByte();
    var fields = <int, dynamic>{
      for (var i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return JournalEntry(
      id: fields[0] as String,
      text: fields[1] as String,
      timestamp: fields[2] as DateTime,
      primaryEmotion: fields[3] as String?,
      intensityScore: fields[4] as int?,
      reflectionPrompt: fields[5] as String?,
      remixes: (fields[6] as List?)?.cast<String>(),
    );
  }

  @override
  void write(BinaryWriter writer, JournalEntry obj) {
    writer
      ..writeByte(7)
      ..writeByte(0)
      ..write(obj.id)
      ..writeByte(1)
      ..write(obj.text)
      ..writeByte(2)
      ..write(obj.timestamp)
      ..writeByte(3)
      ..write(obj.primaryEmotion)
      ..writeByte(4)
      ..write(obj.intensityScore)
      ..writeByte(5)
      ..write(obj.reflectionPrompt)
      ..writeByte(6)
      ..write(obj.remixes);
  }
}
