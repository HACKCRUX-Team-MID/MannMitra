class UserProfile {
  final String occupation;
  final List<String> hobbies;
  final List<String> interests;
  final List<String> dailyStressors;

  UserProfile({
    required this.occupation,
    required this.hobbies,
    required this.interests,
    required this.dailyStressors,
  });

  Map<String, dynamic> toJson() {
    return {
      'occupation': occupation,
      'hobbies': hobbies,
      'interests': interests,
      'dailyStressors': dailyStressors,
    };
  }

  factory UserProfile.fromJson(Map<String, dynamic> json) {
    return UserProfile(
      occupation: json['occupation'] ?? 'none',
      hobbies: List<String>.from(json['hobbies'] ?? []),
      interests: List<String>.from(json['interests'] ?? []),
      dailyStressors: List<String>.from(json['dailyStressors'] ?? []),
    );
  }

  // Predefined empty state for testing or skipped onboarding
  factory UserProfile.empty() {
    return UserProfile(
      occupation: 'none',
      hobbies: [],
      interests: [],
      dailyStressors: [],
    );
  }
}
