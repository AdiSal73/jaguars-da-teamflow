import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle, UnderlineType } from 'npm:docx@8.5.0';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const doc = new Document({
            sections: [{
                properties: {},
                children: [
                    // Title Page
                    new Paragraph({
                        text: "INDIVIDUAL DEVELOPMENT PROGRAM",
                        heading: HeadingLevel.TITLE,
                        alignment: AlignmentType.CENTER,
                        spacing: { before: 2400, after: 400 }
                    }),
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 400 },
                        children: [
                            new TextRun({
                                text: "MICHIGAN JAGUARS",
                                size: 28,
                                bold: true,
                                color: "10B981"
                            })
                        ]
                    }),
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 800 },
                        children: [
                            new TextRun({
                                text: "Transform Your Game Through Expert Training & Development",
                                size: 24,
                                italics: true,
                                color: "64748B"
                            })
                        ]
                    }),
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { before: 400, after: 200 },
                        border: { top: { color: "10B981", space: 8, style: BorderStyle.SINGLE, size: 24 } },
                        children: [
                            new TextRun({
                                text: "Three Pillars of Excellence",
                                size: 22,
                                bold: true
                            })
                        ]
                    }),
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 100 },
                        children: [
                            new TextRun({ text: "• Reflexive Skill Development  ", size: 20, bold: true }),
                            new TextRun({ text: "• Position-Specific Training  ", size: 20, bold: true }),
                            new TextRun({ text: "• Video Analysis", size: 20, bold: true })
                        ]
                    }),

                    // Page Break
                    new Paragraph({
                        text: "",
                        pageBreakBefore: true
                    }),

                    // About Our Program
                    new Paragraph({
                        text: "About Our Program",
                        heading: HeadingLevel.HEADING_1,
                        spacing: { before: 400, after: 300 }
                    }),
                    new Paragraph({
                        spacing: { after: 400 },
                        children: [
                            new TextRun({
                                text: "Our Individual Development Program (IDP) is a comprehensive training system designed to accelerate player growth through three interconnected pillars. Each component has been carefully crafted to address specific aspects of player development, creating a holistic approach that transforms raw talent into elite performance.",
                                size: 22
                            })
                        ]
                    }),

                    // What Makes IDP Different
                    new Paragraph({
                        text: "What Makes IDP Different?",
                        heading: HeadingLevel.HEADING_2,
                        spacing: { before: 400, after: 200 }
                    }),
                    
                    new Paragraph({
                        spacing: { after: 200 },
                        bullet: { level: 0 },
                        children: [
                            new TextRun({ text: "Personalized Approach: ", bold: true, size: 22 }),
                            new TextRun({ text: "1-on-1 coaching tailored to individual needs and goals", size: 22 })
                        ]
                    }),
                    new Paragraph({
                        spacing: { after: 200 },
                        bullet: { level: 0 },
                        children: [
                            new TextRun({ text: "Data-Driven Results: ", bold: true, size: 22 }),
                            new TextRun({ text: "Measurable progress tracking and performance analytics", size: 22 })
                        ]
                    }),
                    new Paragraph({
                        spacing: { after: 200 },
                        bullet: { level: 0 },
                        children: [
                            new TextRun({ text: "Expert Coaching: ", bold: true, size: 22 }),
                            new TextRun({ text: "Experienced staff with proven development track records", size: 22 })
                        ]
                    }),
                    new Paragraph({
                        spacing: { after: 400 },
                        bullet: { level: 0 },
                        children: [
                            new TextRun({ text: "Modern Technology: ", bold: true, size: 22 }),
                            new TextRun({ text: "Video analysis and digital performance tracking tools", size: 22 })
                        ]
                    }),

                    // Page Break
                    new Paragraph({
                        text: "",
                        pageBreakBefore: true
                    }),

                    // Reflexive Skill Development
                    new Paragraph({
                        text: "Reflexive Skill Development",
                        heading: HeadingLevel.HEADING_1,
                        spacing: { before: 200, after: 200 },
                        shading: { fill: "10B981" },
                        children: [
                            new TextRun({
                                text: "Reflexive Skill Development",
                                color: "FFFFFF",
                                bold: true
                            })
                        ]
                    }),
                    new Paragraph({
                        spacing: { after: 200 },
                        children: [
                            new TextRun({
                                text: "Enhance Muscle Memory & Execute with Precision Under Pressure",
                                size: 24,
                                bold: true,
                                italics: true,
                                color: "10B981"
                            })
                        ]
                    }),
                    new Paragraph({
                        spacing: { after: 300 },
                        children: [
                            new TextRun({
                                text: "Reflexive skill development focuses on training your body to react instinctively in high-pressure situations. Through progressive drills that simulate match conditions, players develop automatic responses that allow them to execute technical skills without conscious thought. This training bridges the gap between practice and game performance.",
                                size: 22
                            })
                        ]
                    }),

                    new Paragraph({
                        text: "Training Components:",
                        heading: HeadingLevel.HEADING_3,
                        spacing: { before: 200, after: 200 }
                    }),
                    new Paragraph({
                        spacing: { after: 150 },
                        bullet: { level: 0 },
                        children: [
                            new TextRun({ text: "Pressure Scenario Drills ", bold: true, size: 22 }),
                            new TextRun({ text: "with defenders, time constraints, and decision-making elements", size: 22 })
                        ]
                    }),
                    new Paragraph({
                        spacing: { after: 150 },
                        bullet: { level: 0 },
                        children: [
                            new TextRun({ text: "Reaction Speed Training ", bold: true, size: 22 }),
                            new TextRun({ text: "for split-second decision making and execution", size: 22 })
                        ]
                    }),
                    new Paragraph({
                        spacing: { after: 150 },
                        bullet: { level: 0 },
                        children: [
                            new TextRun({ text: "Technical Mastery ", bold: true, size: 22 }),
                            new TextRun({ text: "in ball control, passing, shooting, and dribbling under pressure", size: 22 })
                        ]
                    }),
                    new Paragraph({
                        spacing: { after: 150 },
                        bullet: { level: 0 },
                        children: [
                            new TextRun({ text: "Cognitive Load Training ", bold: true, size: 22 }),
                            new TextRun({ text: "combining technical execution with tactical awareness", size: 22 })
                        ]
                    }),
                    new Paragraph({
                        spacing: { after: 300 },
                        bullet: { level: 0 },
                        children: [
                            new TextRun({ text: "Muscle Memory Development ", bold: true, size: 22 }),
                            new TextRun({ text: "through thousands of quality repetitions", size: 22 })
                        ]
                    }),

                    new Paragraph({
                        spacing: { after: 400 },
                        shading: { fill: "D1FAE5" },
                        children: [
                            new TextRun({ text: "Expected Outcomes: ", bold: true, size: 22, color: "10B981" }),
                            new TextRun({ text: "Faster decision-making, improved technique under pressure, automatic execution of skills in game situations, and enhanced confidence on the ball.", size: 22 })
                        ]
                    }),

                    // Page Break
                    new Paragraph({
                        text: "",
                        pageBreakBefore: true
                    }),

                    // Position-Specific Training
                    new Paragraph({
                        text: "Position-Specific & Functional Training",
                        heading: HeadingLevel.HEADING_1,
                        spacing: { before: 200, after: 200 },
                        shading: { fill: "3B82F6" },
                        children: [
                            new TextRun({
                                text: "Position-Specific & Functional Training",
                                color: "FFFFFF",
                                bold: true
                            })
                        ]
                    }),
                    new Paragraph({
                        spacing: { after: 200 },
                        children: [
                            new TextRun({
                                text: "Tactical Mastery & Real-Game Coordination",
                                size: 24,
                                bold: true,
                                italics: true,
                                color: "3B82F6"
                            })
                        ]
                    }),
                    new Paragraph({
                        spacing: { after: 300 },
                        children: [
                            new TextRun({
                                text: "Position-specific training tailors development to the unique demands of each role on the field. Whether you're a defender reading attacks, a midfielder orchestrating play, or a forward creating scoring opportunities, this training sharpens the tactical awareness and technical skills specific to your position through realistic game scenarios.",
                                size: 22
                            })
                        ]
                    }),

                    new Paragraph({
                        text: "Training Methodology:",
                        heading: HeadingLevel.HEADING_3,
                        spacing: { before: 200, after: 200 }
                    }),
                    new Paragraph({
                        spacing: { after: 150 },
                        bullet: { level: 0 },
                        children: [
                            new TextRun({ text: "Small Group Scenarios ", bold: true, size: 22 }),
                            new TextRun({ text: "(3v3, 4v4) mirroring game situations and positional demands", size: 22 })
                        ]
                    }),
                    new Paragraph({
                        spacing: { after: 150 },
                        bullet: { level: 0 },
                        children: [
                            new TextRun({ text: "Tactical Decision-Making ", bold: true, size: 22 }),
                            new TextRun({ text: "through pattern recognition, spacing, and timing", size: 22 })
                        ]
                    }),
                    new Paragraph({
                        spacing: { after: 150 },
                        bullet: { level: 0 },
                        children: [
                            new TextRun({ text: "Role-Specific Techniques ", bold: true, size: 22 }),
                            new TextRun({ text: "for defenders, midfielders, forwards, and goalkeepers", size: 22 })
                        ]
                    }),
                    new Paragraph({
                        spacing: { after: 150 },
                        bullet: { level: 0 },
                        children: [
                            new TextRun({ text: "Functional Training ", bold: true, size: 22 }),
                            new TextRun({ text: "with coordinated movements in specific formations", size: 22 })
                        ]
                    }),
                    new Paragraph({
                        spacing: { after: 300 },
                        bullet: { level: 0 },
                        children: [
                            new TextRun({ text: "Game Model Integration ", bold: true, size: 22 }),
                            new TextRun({ text: "understanding team principles and individual responsibilities", size: 22 })
                        ]
                    }),

                    new Paragraph({
                        spacing: { after: 400 },
                        shading: { fill: "DBEAFE" },
                        children: [
                            new TextRun({ text: "Expected Outcomes: ", bold: true, size: 22, color: "3B82F6" }),
                            new TextRun({ text: "Improved positional understanding, enhanced tactical awareness, better coordination with teammates, and increased effectiveness in your specific role.", size: 22 })
                        ]
                    }),

                    // Page Break
                    new Paragraph({
                        text: "",
                        pageBreakBefore: true
                    }),

                    // Video Analysis
                    new Paragraph({
                        text: "Video Analysis & Performance Evaluation",
                        heading: HeadingLevel.HEADING_1,
                        spacing: { before: 200, after: 200 },
                        shading: { fill: "A855F7" },
                        children: [
                            new TextRun({
                                text: "Video Analysis & Performance Evaluation",
                                color: "FFFFFF",
                                bold: true
                            })
                        ]
                    }),
                    new Paragraph({
                        spacing: { after: 200 },
                        children: [
                            new TextRun({
                                text: "Data-Driven Development & SMART Goal Setting",
                                size: 24,
                                bold: true,
                                italics: true,
                                color: "A855F7"
                            })
                        ]
                    }),
                    new Paragraph({
                        spacing: { after: 300 },
                        children: [
                            new TextRun({
                                text: "Video analysis transforms subjective feedback into objective, measurable insights. By reviewing match and training footage with expert coaches, players gain clear understanding of their performance, identify specific improvement areas, and track progress over time with data-backed evidence. Every session builds toward SMART goals that drive continuous improvement.",
                                size: 22
                            })
                        ]
                    }),

                    new Paragraph({
                        text: "Analysis Framework:",
                        heading: HeadingLevel.HEADING_3,
                        spacing: { before: 200, after: 200 }
                    }),
                    new Paragraph({
                        spacing: { after: 150 },
                        bullet: { level: 0 },
                        children: [
                            new TextRun({ text: "Match Footage Review ", bold: true, size: 22 }),
                            new TextRun({ text: "of training sessions and competitive matches", size: 22 })
                        ]
                    }),
                    new Paragraph({
                        spacing: { after: 150 },
                        bullet: { level: 0 },
                        children: [
                            new TextRun({ text: "Expert Annotations ", bold: true, size: 22 }),
                            new TextRun({ text: "with coach commentary on key moments and decisions", size: 22 })
                        ]
                    }),
                    new Paragraph({
                        spacing: { after: 150 },
                        bullet: { level: 0 },
                        children: [
                            new TextRun({ text: "Technical Assessment ", bold: true, size: 22 }),
                            new TextRun({ text: "of first touch, passing, positioning, and movement patterns", size: 22 })
                        ]
                    }),
                    new Paragraph({
                        spacing: { after: 150 },
                        bullet: { level: 0 },
                        children: [
                            new TextRun({ text: "Tactical Evaluation ", bold: true, size: 22 }),
                            new TextRun({ text: "of decision-making, spatial awareness, and game understanding", size: 22 })
                        ]
                    }),
                    new Paragraph({
                        spacing: { after: 150 },
                        bullet: { level: 0 },
                        children: [
                            new TextRun({ text: "Performance Metrics ", bold: true, size: 22 }),
                            new TextRun({ text: "with quantifiable data on touches, passes, and effectiveness", size: 22 })
                        ]
                    }),
                    new Paragraph({
                        spacing: { after: 300 },
                        bullet: { level: 0 },
                        children: [
                            new TextRun({ text: "SMART Development Plans ", bold: true, size: 22 }),
                            new TextRun({ text: "with Specific, Measurable, Achievable, Relevant, Time-bound goals", size: 22 })
                        ]
                    }),

                    new Paragraph({
                        spacing: { after: 400 },
                        shading: { fill: "F3E8FF" },
                        children: [
                            new TextRun({ text: "Expected Outcomes: ", bold: true, size: 22, color: "A855F7" }),
                            new TextRun({ text: "Objective self-awareness, targeted improvement plans, measurable progress tracking, and accelerated development through evidence-based training.", size: 22 })
                        ]
                    }),

                    // Page Break
                    new Paragraph({
                        text: "",
                        pageBreakBefore: true
                    }),

                    // Final CTA
                    new Paragraph({
                        text: "Ready to Transform Your Game?",
                        heading: HeadingLevel.HEADING_1,
                        alignment: AlignmentType.CENTER,
                        spacing: { before: 800, after: 400 }
                    }),
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 400 },
                        children: [
                            new TextRun({
                                text: "Join hundreds of players who have elevated their performance through our Individual Development Program",
                                size: 24,
                                italics: true
                            })
                        ]
                    }),

                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 200 },
                        border: { top: { color: "10B981", space: 8, style: BorderStyle.SINGLE, size: 24 } },
                        children: [
                            new TextRun({ text: "500+ Players Trained  •  ", size: 26, bold: true, color: "10B981" }),
                            new TextRun({ text: "15+ Expert Coaches  •  ", size: 26, bold: true, color: "3B82F6" }),
                            new TextRun({ text: "1000+ Training Hours", size: 26, bold: true, color: "A855F7" })
                        ]
                    }),

                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { before: 600, after: 200 },
                        shading: { fill: "10B981" },
                        children: [
                            new TextRun({
                                text: "BOOK YOUR FIRST SESSION TODAY",
                                size: 28,
                                bold: true,
                                color: "FFFFFF"
                            })
                        ]
                    }),
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 400 },
                        children: [
                            new TextRun({
                                text: "Visit our booking system to get started",
                                size: 22,
                                color: "64748B"
                            })
                        ]
                    }),

                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { before: 800 },
                        border: { top: { color: "E2E8F0", space: 8, style: BorderStyle.SINGLE, size: 12 } },
                        children: [
                            new TextRun({
                                text: "Michigan Jaguars Individual Development Program",
                                size: 18,
                                color: "64748B"
                            })
                        ]
                    }),
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                            new TextRun({
                                text: "© 2026 Michigan Jaguars. All rights reserved.",
                                size: 16,
                                color: "94A3B8"
                            })
                        ]
                    })
                ]
            }]
        });

        const buffer = await Packer.toBuffer(doc);

        return new Response(buffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'Content-Disposition': 'attachment; filename="IDP-Training-Brochure.docx"'
            }
        });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});