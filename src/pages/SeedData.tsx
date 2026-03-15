import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../utils/supabase'

const emotions = [
  { emotion: 'joy', emoji: '😊', tags: ['#grateful', '#friends', '#sunshine'] },
  { emotion: 'calm', emoji: '😌', tags: ['#meditation', '#nature', '#peaceful'] },
  { emotion: 'stress', emoji: '😰', tags: ['#work', '#deadline', '#pressure'] },
  { emotion: 'sadness', emoji: '😢', tags: ['#lonely', '#tired', '#overwhelmed'] },
  { emotion: 'excited', emoji: '🤩', tags: ['#achievement', '#celebration', '#energy'] },
  { emotion: 'anxious', emoji: '😟', tags: ['#exam', '#uncertainty', '#worry'] },
  { emotion: 'grateful', emoji: '🙏', tags: ['#family', '#health', '#blessed'] },
  { emotion: 'neutral', emoji: '😐', tags: ['#routine', '#normal', '#okay'] },
]

const texts = [
  "Had a wonderful morning walk today. The fresh air really helped clear my mind and I feel so much more positive about the day ahead.",
  "Work was incredibly stressful today. Multiple deadlines piling up and I couldn't focus properly. Need to find better ways to manage my time.",
  "Spent quality time with family over dinner. We laughed so much and it reminded me how important these moments are.",
  "Feeling a bit down today. Couldn't sleep well last night and everything feels like too much effort. Hope tomorrow is better.",
  "Completed my meditation practice for the 5th day in a row! I can already feel the difference in how I handle stressful situations.",
  "Got amazing feedback on my project! All the hard work is finally paying off and I feel proud of what I've accomplished.",
  "Rainy day kept me indoors. Read a good book and made some tea. Sometimes quiet days are exactly what you need.",
  "Had a difficult conversation with a friend. It was uncomfortable but necessary. Feeling a mix of relief and sadness.",
  "Tried a new recipe today and it turned out great! Cooking is becoming a nice creative outlet for me.",
  "Feeling anxious about the upcoming presentation. Practiced a few times but still not confident. Will do more prep tomorrow.",
  "Beautiful sunset today while walking home. Took a moment to just breathe and appreciate the beauty around me.",
  "Journaling has become such a calming habit. Writing down my thoughts helps me process emotions I didn't even know I had.",
  "Woke up feeling refreshed and energetic. Had a productive morning and tackled tasks I'd been putting off for weeks.",
  "Struggled with focus today. My mind kept wandering and I couldn't concentrate on anything for too long.",
  "Grateful for the support system I have. Talked to my best friend and felt so much lighter afterwards.",
  "Tried deep breathing exercises during a stressful moment at work and it actually helped! Small wins matter.",
  "Felt overwhelmed by responsibilities today. Need to learn to say no more often and prioritize self-care.",
  "Had a great workout session. Physical activity always boosts my mood and helps me think more clearly.",
  "Spent the evening stargazing. The vastness of the universe puts everything in perspective.",
  "Today was just okay. Nothing special happened but nothing bad either. Sometimes ordinary is perfectly fine.",
  "Received constructive criticism and took it well. Growth mindset is slowly becoming part of who I am.",
  "Couldn't shake off a feeling of restlessness all day. Maybe I need to change up my routine a bit.",
  "Volunteered at a local shelter today. Helping others always fills my heart with joy and purpose.",
  "Had trouble sleeping again. My mind races at night with all the things I need to do tomorrow.",
  "Started learning a new skill today. Felt both excited and nervous. Stepping out of comfort zone is scary but necessary.",
  "Peaceful morning with yoga and chai. Setting positive intentions for the day made a real difference.",
  "Felt a wave of nostalgia today. Looking at old photos and remembering simpler times brought a smile.",
  "Great team meeting today. Everyone was collaborative and we came up with some brilliant ideas together.",
  "Took a mental health day and it was the best decision. Sometimes you just need to pause and recharge.",
  "Ending the day feeling content. Not everything went perfectly but I handled things well and that counts.",
]

export default function SeedData() {
  const { user } = useAuth()
  const [status, setStatus] = useState('Ready to seed')
  const [count, setCount] = useState(0)

  const seed = async () => {
    if (!user?.id) { setStatus('No user logged in!'); return }

    setStatus('Generating entries...')
    const entries: any[] = []
    const now = new Date()

    for (let day = 14; day >= 0; day--) {
      const perDay = Math.floor(Math.random() * 3) + 1
      for (let e = 0; e < perDay; e++) {
        const date = new Date(now)
        date.setDate(date.getDate() - day)
        date.setHours(8 + Math.floor(Math.random() * 14), Math.floor(Math.random() * 60), 0, 0)

        const em = emotions[Math.floor(Math.random() * emotions.length)]
        const text = texts[Math.floor(Math.random() * texts.length)]
        entries.push({
          user_id: user.id,
          emotion: em.emotion,
          emoji: em.emoji,
          intensity: Math.floor(Math.random() * 7) + 3,
          text,
          tags: em.tags.slice(0, Math.floor(Math.random() * 3) + 1),
          word_count: text.split(' ').length,
          timestamp: date.toISOString(),
          detected_emotion: em.emotion,
          confidence: parseFloat((0.7 + Math.random() * 0.25).toFixed(2)),
          sleep_hours: parseFloat((5 + Math.random() * 4).toFixed(1)),
          exercise_minutes: Math.floor(Math.random() * 60),
        })
      }
    }

    setStatus(`Inserting ${entries.length} entries...`)

    const { data, error } = await supabase
      .from('journal_entries')
      .insert(entries)
      .select('id')

    if (error) {
      setStatus(`Error: ${error.message}`)
    } else {
      setCount(data.length)
      setStatus(`✅ Done! Inserted ${data.length} entries.`)
    }
  }

  return (
    <div style={{ padding: '40px', maxWidth: 500, margin: '0 auto', textAlign: 'center' }}>
      <h2 style={{ marginBottom: 16 }}>Seed Demo Data</h2>
      <p style={{ marginBottom: 8, color: '#666' }}>User: {user?.name} ({user?.id})</p>
      <p style={{ marginBottom: 24, fontSize: 14, color: '#888' }}>
        This will insert ~30 realistic journal entries over the past 15 days.
      </p>
      <button
        onClick={seed}
        style={{
          padding: '12px 32px', fontSize: 16, fontWeight: 700,
          background: '#7c3aed', color: 'white', border: 'none',
          borderRadius: 12, cursor: 'pointer',
        }}
      >
        🌱 Seed Data
      </button>
      <p style={{ marginTop: 20, fontWeight: 600 }}>{status}</p>
      {count > 0 && (
        <p style={{ marginTop: 8, color: '#22c55e' }}>
          Now go to <a href="/dashboard">Dashboard</a> or <a href="/insights">Insights</a> to see your data!
        </p>
      )}
    </div>
  )
}
