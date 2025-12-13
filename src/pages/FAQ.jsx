import React, { useState } from 'react';
import { ChevronDown, ChevronUp, HelpCircle, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

const faqData = [
  {
    category: 'Getting Started',
    questions: [
      {
        q: 'How do I access my player dashboard?',
        a: 'Once your account is created, you will automatically be redirected to your player dashboard. You can also access it from the "Player Profile" menu.'
      },
      {
        q: 'How do I reset my password?',
        a: 'Contact your coach or club administrator to reset your password.'
      },
      {
        q: 'Who can see my player data?',
        a: 'Only you, your assigned parents, your coaches, and club administrators can view your player dashboard. Other players cannot see your information.'
      }
    ]
  },
  {
    category: 'Player Features',
    questions: [
      {
        q: 'What are player goals?',
        a: 'Player goals are personalized development objectives that you can set and track. Your coach can provide feedback on your progress.'
      },
      {
        q: 'How often are evaluations conducted?',
        a: 'Evaluations are typically conducted at key points during the season. Your coach will notify you when new evaluations are available.'
      },
      {
        q: 'What do the physical assessment scores mean?',
        a: 'Physical assessments measure Speed, Power, Endurance, and Agility. Scores are calculated based on standardized tests (20m sprint, vertical jump, YIRT, shuttle run). Higher scores indicate better performance.'
      }
    ]
  },
  {
    category: 'Parent Access',
    questions: [
      {
        q: 'Can parents access player dashboards?',
        a: 'Yes, parents who are assigned to players can view their child\'s dashboard, including evaluations, assessments, goals, and injury history.'
      },
      {
        q: 'How do I get assigned as a parent?',
        a: 'Club administrators assign parents to players through the User Management section. Contact your club admin if you need to be assigned.'
      },
      {
        q: 'Can I book coaching sessions?',
        a: 'Yes, parents and players can book coaching sessions through the "Book Session" menu. You can view available coaches and their time slots.'
      }
    ]
  },
  {
    category: 'Coach Features',
    questions: [
      {
        q: 'How do I create player evaluations?',
        a: 'Navigate to the Evaluations page from the Tryouts menu, click "New Evaluation", select a player, and fill out the evaluation form with ratings and notes.'
      },
      {
        q: 'Can I compare players?',
        a: 'Yes, on the Team Dashboard, you can select multiple players and click "Compare" to see side-by-side comparisons of their metrics.'
      },
      {
        q: 'How do I manage my availability for bookings?',
        a: 'Go to "My Availability" in the Coaching Tools menu to set up your weekly schedule and availability slots.'
      }
    ]
  },
  {
    category: 'Data & Privacy',
    questions: [
      {
        q: 'Is my data secure?',
        a: 'Yes, all data is securely stored and encrypted. Only authorized users (coaches, admins, assigned parents) can access player information.'
      },
      {
        q: 'Can I export my player data?',
        a: 'Yes, players and coaches can export player data to CSV or PDF format from the player dashboard.'
      },
      {
        q: 'What happens to my data if I leave the club?',
        a: 'Your data remains in the system for record-keeping purposes but your account will be marked as inactive. Contact the club admin for data deletion requests.'
      }
    ]
  }
];

export default function FAQ() {
  const [expandedItems, setExpandedItems] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState('');

  const toggleItem = (categoryIndex, questionIndex) => {
    const key = `${categoryIndex}-${questionIndex}`;
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedItems(newExpanded);
  };

  const filteredFAQ = faqData.map(category => ({
    ...category,
    questions: category.questions.filter(item =>
      item.q.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.a.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(category => category.questions.length > 0);

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-xl flex items-center justify-center">
            <HelpCircle className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Frequently Asked Questions</h1>
        </div>
        <p className="text-slate-600 ml-15">Find answers to common questions about the Soccer Club Management System</p>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input
            placeholder="Search questions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-12 border-2"
          />
        </div>
      </div>

      <div className="space-y-6">
        {filteredFAQ.map((category, categoryIndex) => (
          <Card key={categoryIndex} className="border-none shadow-lg">
            <CardHeader className="bg-gradient-to-r from-emerald-50 to-blue-50 border-b">
              <CardTitle className="text-lg text-slate-900">{category.category}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {category.questions.map((item, questionIndex) => {
                  const key = `${categoryIndex}-${questionIndex}`;
                  const isExpanded = expandedItems.has(key);
                  return (
                    <div key={questionIndex}>
                      <button
                        onClick={() => toggleItem(categoryIndex, questionIndex)}
                        className="w-full p-4 flex items-start justify-between hover:bg-slate-50 transition-colors text-left"
                      >
                        <div className="flex-1 pr-4">
                          <h3 className="font-semibold text-slate-900">{item.q}</h3>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-slate-400 flex-shrink-0" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-slate-400 flex-shrink-0" />
                        )}
                      </button>
                      {isExpanded && (
                        <div className="px-4 pb-4 text-slate-600 bg-slate-50">
                          <p className="leading-relaxed">{item.a}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredFAQ.length === 0 && (
        <Card className="border-none shadow-lg">
          <CardContent className="p-12 text-center">
            <HelpCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">No questions found matching your search</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}