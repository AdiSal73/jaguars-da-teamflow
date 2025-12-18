import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, ChevronDown, Users, Shield, Calendar, TrendingUp, HelpCircle } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export default function FAQ() {
  const [search, setSearch] = useState('');

  const categories = [
    {
      title: 'General',
      icon: HelpCircle,
      color: 'emerald',
      faqs: [
        {
          question: 'What is Michigan Jaguars?',
          answer: 'Michigan Jaguars is a premier youth soccer development organization serving communities across Michigan. We offer competitive teams at various levels including Girls Academy, Aspire, and United leagues.'
        },
        {
          question: 'How many branches do you have?',
          answer: 'We operate 12 branches across Michigan: CW3, Dearborn, Downriver, Genesee, Huron Valley, Jackson, Lansing, Marshall, Northville, Novi, Rochester Romeo, and West Bloomfield.'
        },
        {
          question: 'What age groups do you serve?',
          answer: 'We serve players from U-8 through U-19, with teams organized by age group and competitive level.'
        }
      ]
    },
    {
      title: 'For Players',
      icon: Users,
      color: 'blue',
      faqs: [
        {
          question: 'How do I access my player profile?',
          answer: 'Players can access their profiles by logging in and navigating to the Player Dashboard. Parents can view their child\'s profile through their parent portal.'
        },
        {
          question: 'How are player evaluations conducted?',
          answer: 'Players are evaluated through physical assessments (sprint, vertical jump, YIRT, shuttle) and technical evaluations covering mental attributes, defending, and attacking skills.'
        },
        {
          question: 'Can I set personal development goals?',
          answer: 'Yes! Players and coaches can set personalized development goals with AI-assisted recommendations, timelines, and progress tracking.'
        },
        {
          question: 'How do I book individual training sessions?',
          answer: 'Use the "Book Session" feature to view coach availability and schedule one-on-one or small group training sessions.'
        }
      ]
    },
    {
      title: 'For Parents',
      icon: Shield,
      color: 'purple',
      faqs: [
        {
          question: 'How do I get access to the parent portal?',
          answer: 'Parents receive an email invitation to create their account. Once registered, you\'ll have access to your child\'s player dashboard, performance data, and communications.'
        },
        {
          question: 'How do I view my child\'s progress?',
          answer: 'Navigate to your child\'s Player Dashboard to view their evaluations, physical assessments, development goals, training modules, and injury status.'
        },
        {
          question: 'How do I communicate with coaches?',
          answer: 'Use the Communications section to send messages directly to coaches, or respond to announcements and notifications.'
        },
        {
          question: 'Can I book private training for my child?',
          answer: 'Yes! Use the "Book Session" feature to schedule individual or small group sessions with available coaches.'
        }
      ]
    },
    {
      title: 'For Coaches',
      icon: Calendar,
      color: 'orange',
      faqs: [
        {
          question: 'How do I create player evaluations?',
          answer: 'Navigate to the player\'s dashboard and click "Create Evaluation" to assess their performance across mental, physical, defending, and attacking categories.'
        },
        {
          question: 'How do I manage my team roster?',
          answer: 'Use the Teams section to view your roster, add/remove players, and update team information. The Formation View allows you to organize players by position and ranking.'
        },
        {
          question: 'How do I set my coaching availability?',
          answer: 'Go to "My Availability" to set your available time slots, locations, and services for individual coaching sessions.'
        },
        {
          question: 'Can I export player or team data?',
          answer: 'Yes! Most pages include export options for CSV and PDF formats, allowing you to download player profiles, team rosters, and performance reports.'
        }
      ]
    },
    {
      title: 'Platform Features',
      icon: TrendingUp,
      color: 'cyan',
      faqs: [
        {
          question: 'What is the Formation View?',
          answer: 'Formation View is an interactive tool that allows coaches to visualize team formations, rank players by position, and manage depth charts with drag-and-drop functionality.'
        },
        {
          question: 'How does the AI-powered development work?',
          answer: 'Our AI analyzes player data, evaluations, and assessments to generate personalized development goals, training recommendations, and performance insights.'
        },
        {
          question: 'What are physical assessments?',
          answer: 'Physical assessments measure Speed (20m sprint), Power (vertical jump), Endurance (YIRT), and Agility (shuttle run) to track athletic development over time.'
        },
        {
          question: 'How is data secured?',
          answer: 'We use role-based access control to ensure that only authorized users can view and edit specific data. Parents see only their children\'s information, coaches see their teams, and admins have full access.'
        }
      ]
    }
  ];

  const filteredCategories = categories.map(category => ({
    ...category,
    faqs: category.faqs.filter(faq => 
      search === '' || 
      faq.question.toLowerCase().includes(search.toLowerCase()) || 
      faq.answer.toLowerCase().includes(search.toLowerCase())
    )
  })).filter(category => category.faqs.length > 0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-emerald-50 to-slate-50">
      {/* Hero */}
      <section className="relative py-20 bg-gradient-to-r from-emerald-600 to-green-600 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }} />
        </div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <HelpCircle className="w-16 h-16 mx-auto mb-6" />
          <h1 className="text-5xl md:text-6xl font-bold mb-6">Frequently Asked Questions</h1>
          <p className="text-xl text-emerald-100">
            Find answers to common questions about Michigan Jaguars and our platform
          </p>
        </div>
      </section>

      {/* Search */}
      <section className="py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              placeholder="Search questions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-12 h-14 text-lg shadow-lg border-2 border-emerald-100 focus:border-emerald-500"
            />
          </div>
        </div>
      </section>

      {/* FAQ Categories */}
      <section className="pb-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          {filteredCategories.map(category => {
            const IconComponent = category.icon;
            const gradientClass = colorMap[category.color];
            
            return (
              <Card key={category.title} className="border-none shadow-xl overflow-hidden">
                <div className={`bg-gradient-to-r ${gradientClass} text-white p-6`}>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                      <IconComponent className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">{category.title}</h2>
                      <p className="text-white/80 text-sm">{category.faqs.length} questions</p>
                    </div>
                  </div>
                </div>
                <CardContent className="p-6">
                  <Accordion type="single" collapsible className="space-y-4">
                    {category.faqs.map((faq, index) => (
                      <AccordionItem key={index} value={`item-${index}`} className="border-2 border-slate-100 rounded-xl px-4 hover:border-emerald-200 transition-all">
                        <AccordionTrigger className="text-left hover:no-underline py-4">
                          <span className="font-semibold text-slate-900 pr-4">{faq.question}</span>
                        </AccordionTrigger>
                        <AccordionContent className="text-slate-600 pb-4 leading-relaxed">
                          {faq.answer}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            );
          })}

          {filteredCategories.length === 0 && (
            <div className="text-center py-12">
              <p className="text-slate-500 text-lg">No questions match your search</p>
            </div>
          )}
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-16 bg-gradient-to-r from-emerald-600 to-green-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Still have questions?</h2>
          <p className="text-emerald-100 text-lg mb-6">
            Can't find the answer you're looking for? Reach out to your coach or club administrator.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="mailto:info@michiganjaguars.com"
              className="inline-flex items-center justify-center px-6 py-3 bg-white text-emerald-600 rounded-lg font-semibold hover:bg-emerald-50 transition-all"
            >
              Contact Support
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}