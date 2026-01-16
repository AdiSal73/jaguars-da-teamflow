import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { jsPDF } from 'npm:jspdf@2.5.1';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 20;
        const contentWidth = pageWidth - (2 * margin);

        // Color scheme
        const colors = {
            emerald: [16, 185, 129],
            blue: [59, 130, 246],
            purple: [168, 85, 247],
            dark: [30, 41, 59],
            light: [248, 250, 252],
            text: [51, 65, 85]
        };

        // Page 1: Cover Page
        // Background gradient effect
        doc.setFillColor(...colors.emerald);
        doc.rect(0, 0, pageWidth, pageHeight / 2, 'F');
        doc.setFillColor(...colors.blue);
        doc.rect(0, pageHeight / 2, pageWidth, pageHeight / 2, 'F');

        // Overlay pattern
        doc.setFillColor(255, 255, 255);
        doc.setGState(doc.GState({ opacity: 0.1 }));
        for (let i = 0; i < 20; i++) {
            doc.circle(Math.random() * pageWidth, Math.random() * pageHeight, Math.random() * 30, 'F');
        }
        doc.setGState(doc.GState({ opacity: 1 }));

        // Logo placeholder (circle)
        doc.setFillColor(255, 255, 255);
        doc.circle(pageWidth / 2, 40, 15, 'F');
        doc.setFillColor(...colors.emerald);
        doc.circle(pageWidth / 2, 40, 12, 'F');
        
        // Title
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(36);
        doc.setFont('helvetica', 'bold');
        doc.text('INDIVIDUAL', pageWidth / 2, 90, { align: 'center' });
        doc.text('DEVELOPMENT', pageWidth / 2, 105, { align: 'center' });
        doc.text('PROGRAM', pageWidth / 2, 120, { align: 'center' });
        
        doc.setFontSize(14);
        doc.setFont('helvetica', 'normal');
        doc.text('MICHIGAN JAGUARS', pageWidth / 2, 135, { align: 'center' });
        
        // Subtitle box
        doc.setFillColor(255, 255, 255);
        doc.setGState(doc.GState({ opacity: 0.2 }));
        doc.roundedRect(margin, 155, contentWidth, 30, 3, 3, 'F');
        doc.setGState(doc.GState({ opacity: 1 }));
        
        doc.setFontSize(12);
        doc.setFont('helvetica', 'italic');
        doc.text('Transform Your Game Through', pageWidth / 2, 167, { align: 'center' });
        doc.text('Expert Training & Development', pageWidth / 2, 177, { align: 'center' });

        // Three pillars preview
        const pillarY = 210;
        const pillarSpacing = contentWidth / 3;
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        
        // Pillar 1
        doc.setFillColor(255, 255, 255);
        doc.setGState(doc.GState({ opacity: 0.15 }));
        doc.roundedRect(margin + 5, pillarY, pillarSpacing - 10, 40, 3, 3, 'F');
        doc.setGState(doc.GState({ opacity: 1 }));
        doc.text('Reflexive', margin + pillarSpacing / 2, pillarY + 15, { align: 'center' });
        doc.text('Skills', margin + pillarSpacing / 2, pillarY + 25, { align: 'center' });
        
        // Pillar 2
        doc.setFillColor(255, 255, 255);
        doc.setGState(doc.GState({ opacity: 0.15 }));
        doc.roundedRect(margin + pillarSpacing + 5, pillarY, pillarSpacing - 10, 40, 3, 3, 'F');
        doc.setGState(doc.GState({ opacity: 1 }));
        doc.text('Position', margin + pillarSpacing + pillarSpacing / 2, pillarY + 15, { align: 'center' });
        doc.text('Training', margin + pillarSpacing + pillarSpacing / 2, pillarY + 25, { align: 'center' });
        
        // Pillar 3
        doc.setFillColor(255, 255, 255);
        doc.setGState(doc.GState({ opacity: 0.15 }));
        doc.roundedRect(margin + (2 * pillarSpacing) + 5, pillarY, pillarSpacing - 10, 40, 3, 3, 'F');
        doc.setGState(doc.GState({ opacity: 1 }));
        doc.text('Video', margin + (2 * pillarSpacing) + pillarSpacing / 2, pillarY + 15, { align: 'center' });
        doc.text('Analysis', margin + (2 * pillarSpacing) + pillarSpacing / 2, pillarY + 25, { align: 'center' });

        // Page 2: Introduction
        doc.addPage();
        let y = 30;
        
        doc.setTextColor(...colors.text);
        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        doc.text('About Our Program', margin, y);
        y += 15;
        
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        const introLines = doc.splitTextToSize('Our Individual Development Program (IDP) is a comprehensive training system designed to accelerate player growth through three interconnected pillars. Each component has been carefully crafted to address specific aspects of player development, creating a holistic approach that transforms raw talent into elite performance.', contentWidth);
        doc.text(introLines, margin, y);
        y += introLines.length * 6 + 10;

        // Key benefits boxes
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('What Makes IDP Different?', margin, y);
        y += 10;

        const benefits = [
            { title: 'Personalized Approach', text: '1-on-1 coaching tailored to individual needs and goals' },
            { title: 'Data-Driven Results', text: 'Measurable progress tracking and performance analytics' },
            { title: 'Expert Coaching', text: 'Experienced staff with proven development track records' },
            { title: 'Modern Technology', text: 'Video analysis and digital performance tracking tools' }
        ];

        benefits.forEach((benefit, i) => {
            const boxY = y + (i * 28);
            
            // Colored accent bar
            doc.setFillColor(...colors.emerald);
            doc.rect(margin, boxY, 3, 20, 'F');
            
            // Box background
            doc.setFillColor(...colors.light);
            doc.roundedRect(margin + 5, boxY, contentWidth - 5, 20, 2, 2, 'F');
            
            // Text
            doc.setTextColor(...colors.dark);
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.text(benefit.title, margin + 10, boxY + 8);
            
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.text(benefit.text, margin + 10, boxY + 15);
        });

        // Page 3: Reflexive Skill Development
        doc.addPage();
        y = 30;
        
        // Header with colored background
        doc.setFillColor(...colors.emerald);
        doc.roundedRect(0, 20, pageWidth, 25, 0, 0, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.text('Reflexive Skill Development', pageWidth / 2, 35, { align: 'center' });
        y = 55;
        
        doc.setTextColor(...colors.text);
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bolditalic');
        doc.text('Enhance Muscle Memory & Execute with Precision Under Pressure', margin, y);
        y += 12;
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        const reflexiveDesc = doc.splitTextToSize('Reflexive skill development focuses on training your body to react instinctively in high-pressure situations. Through progressive drills that simulate match conditions, players develop automatic responses that allow them to execute technical skills without conscious thought. This training bridges the gap between practice and game performance.', contentWidth);
        doc.text(reflexiveDesc, margin, y);
        y += reflexiveDesc.length * 5 + 15;

        // Key components with icons
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Training Components:', margin, y);
        y += 10;

        const reflexivePoints = [
            'Pressure Scenario Drills with defenders and time constraints',
            'Reaction Speed Training for split-second decision making',
            'Technical Mastery in ball control, passing, shooting, dribbling',
            'Cognitive Load Training combining technique with awareness',
            'Muscle Memory through thousands of quality repetitions'
        ];

        reflexivePoints.forEach(point => {
            // Bullet circle
            doc.setFillColor(...colors.emerald);
            doc.circle(margin + 3, y - 2, 2, 'F');
            
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            const lines = doc.splitTextToSize(point, contentWidth - 15);
            doc.text(lines, margin + 10, y);
            y += lines.length * 5 + 5;
        });

        y += 10;
        
        // Outcome box
        doc.setFillColor(...colors.emerald);
        doc.setGState(doc.GState({ opacity: 0.1 }));
        doc.roundedRect(margin, y, contentWidth, 30, 3, 3, 'F');
        doc.setGState(doc.GState({ opacity: 1 }));
        
        doc.setTextColor(...colors.emerald);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('Expected Outcomes:', margin + 5, y + 10);
        
        doc.setTextColor(...colors.text);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        const outcome1 = doc.splitTextToSize('Faster decision-making, improved technique under pressure, automatic execution of skills in game situations, and enhanced confidence on the ball.', contentWidth - 10);
        doc.text(outcome1, margin + 5, y + 18);

        // Page 4: Position-Specific Training
        doc.addPage();
        y = 30;
        
        doc.setFillColor(...colors.blue);
        doc.roundedRect(0, 20, pageWidth, 25, 0, 0, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.text('Position-Specific & Functional Training', pageWidth / 2, 35, { align: 'center' });
        y = 55;
        
        doc.setTextColor(...colors.text);
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bolditalic');
        doc.text('Tactical Mastery & Real-Game Coordination', margin, y);
        y += 12;
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        const positionDesc = doc.splitTextToSize('Position-specific training tailors development to the unique demands of each role on the field. Whether you\'re a defender reading attacks, a midfielder orchestrating play, or a forward creating scoring opportunities, this training sharpens the tactical awareness and technical skills specific to your position through realistic game scenarios.', contentWidth);
        doc.text(positionDesc, margin, y);
        y += positionDesc.length * 5 + 15;

        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Training Methodology:', margin, y);
        y += 10;

        const positionPoints = [
            'Small Group Scenarios (3v3, 4v4) mirroring game situations',
            'Tactical Decision-Making through pattern recognition',
            'Role-Specific Techniques for each position and player type',
            'Functional Training with coordinated team movements',
            'Game Model Integration understanding team principles'
        ];

        positionPoints.forEach(point => {
            doc.setFillColor(...colors.blue);
            doc.circle(margin + 3, y - 2, 2, 'F');
            
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            const lines = doc.splitTextToSize(point, contentWidth - 15);
            doc.text(lines, margin + 10, y);
            y += lines.length * 5 + 5;
        });

        y += 10;
        
        doc.setFillColor(...colors.blue);
        doc.setGState(doc.GState({ opacity: 0.1 }));
        doc.roundedRect(margin, y, contentWidth, 30, 3, 3, 'F');
        doc.setGState(doc.GState({ opacity: 1 }));
        
        doc.setTextColor(...colors.blue);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('Expected Outcomes:', margin + 5, y + 10);
        
        doc.setTextColor(...colors.text);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        const outcome2 = doc.splitTextToSize('Improved positional understanding, enhanced tactical awareness, better coordination with teammates, and increased effectiveness in your specific role.', contentWidth - 10);
        doc.text(outcome2, margin + 5, y + 18);

        // Page 5: Video Analysis
        doc.addPage();
        y = 30;
        
        doc.setFillColor(...colors.purple);
        doc.roundedRect(0, 20, pageWidth, 25, 0, 0, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.text('Video Analysis & Performance Evaluation', pageWidth / 2, 35, { align: 'center' });
        y = 55;
        
        doc.setTextColor(...colors.text);
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bolditalic');
        doc.text('Data-Driven Development & SMART Goal Setting', margin, y);
        y += 12;
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        const videoDesc = doc.splitTextToSize('Video analysis transforms subjective feedback into objective, measurable insights. By reviewing match and training footage with expert coaches, players gain clear understanding of their performance, identify specific improvement areas, and track progress over time with data-backed evidence. Every session builds toward SMART goals that drive continuous improvement.', contentWidth);
        doc.text(videoDesc, margin, y);
        y += videoDesc.length * 5 + 15;

        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Analysis Framework:', margin, y);
        y += 10;

        const videoPoints = [
            'Match Footage Review of training and competitive matches',
            'Expert Annotations with coach commentary on key moments',
            'Technical Assessment of touch, passing, positioning, movement',
            'Tactical Evaluation of decision-making and game reading',
            'Performance Metrics with quantifiable data and statistics',
            'SMART Development Plans with clear, measurable goals'
        ];

        videoPoints.forEach(point => {
            doc.setFillColor(...colors.purple);
            doc.circle(margin + 3, y - 2, 2, 'F');
            
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            const lines = doc.splitTextToSize(point, contentWidth - 15);
            doc.text(lines, margin + 10, y);
            y += lines.length * 5 + 5;
        });

        y += 10;
        
        doc.setFillColor(...colors.purple);
        doc.setGState(doc.GState({ opacity: 0.1 }));
        doc.roundedRect(margin, y, contentWidth, 30, 3, 3, 'F');
        doc.setGState(doc.GState({ opacity: 1 }));
        
        doc.setTextColor(...colors.purple);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('Expected Outcomes:', margin + 5, y + 10);
        
        doc.setTextColor(...colors.text);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        const outcome3 = doc.splitTextToSize('Objective self-awareness, targeted improvement plans, measurable progress tracking, and accelerated development through evidence-based training.', contentWidth - 10);
        doc.text(outcome3, margin + 5, y + 18);

        // Page 6: Next Steps
        doc.addPage();
        
        // Gradient background
        doc.setFillColor(...colors.emerald);
        doc.rect(0, 0, pageWidth, pageHeight / 3, 'F');
        doc.setFillColor(...colors.blue);
        doc.rect(0, pageHeight / 3, pageWidth, pageHeight / 3, 'F');
        doc.setFillColor(...colors.purple);
        doc.rect(0, (2 * pageHeight) / 3, pageWidth, pageHeight / 3, 'F');
        
        // Overlay
        doc.setFillColor(255, 255, 255);
        doc.setGState(doc.GState({ opacity: 0.95 }));
        doc.roundedRect(margin, 40, contentWidth, 180, 5, 5, 'F');
        doc.setGState(doc.GState({ opacity: 1 }));
        
        y = 60;
        doc.setTextColor(...colors.dark);
        doc.setFontSize(26);
        doc.setFont('helvetica', 'bold');
        doc.text('Ready to Transform', pageWidth / 2, y, { align: 'center' });
        doc.text('Your Game?', pageWidth / 2, y + 12, { align: 'center' });
        y += 30;
        
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.text('Join hundreds of players who have elevated their performance', pageWidth / 2, y, { align: 'center' });
        doc.text('through our Individual Development Program', pageWidth / 2, y + 7, { align: 'center' });
        y += 25;

        // Stats boxes
        const statY = y;
        const statWidth = contentWidth / 3 - 5;
        
        [[500, 'Players Trained'], [15, 'Expert Coaches'], [1000, 'Training Hours']].forEach((stat, i) => {
            const x = margin + (i * (statWidth + 7.5));
            doc.setFillColor(...colors.light);
            doc.roundedRect(x, statY, statWidth, 35, 3, 3, 'F');
            
            doc.setTextColor(...colors.emerald);
            doc.setFontSize(24);
            doc.setFont('helvetica', 'bold');
            doc.text(`${stat[0]}+`, x + statWidth / 2, statY + 15, { align: 'center' });
            
            doc.setTextColor(...colors.text);
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.text(stat[1], x + statWidth / 2, statY + 25, { align: 'center' });
        });
        
        y = statY + 50;
        
        // CTA box
        doc.setFillColor(...colors.emerald);
        doc.roundedRect(margin + 20, y, contentWidth - 40, 35, 5, 5, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('BOOK YOUR FIRST SESSION TODAY', pageWidth / 2, y + 15, { align: 'center' });
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('Visit our booking system to get started', pageWidth / 2, y + 25, { align: 'center' });

        // Footer
        y = pageHeight - 20;
        doc.setTextColor(...colors.text);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text('Michigan Jaguars Individual Development Program', pageWidth / 2, y, { align: 'center' });
        doc.text('© 2026 Michigan Jaguars. All rights reserved.', pageWidth / 2, y + 5, { align: 'center' });

        const pdfBytes = doc.output('arraybuffer');

        return new Response(pdfBytes, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': 'attachment; filename="IDP-Training-Brochure.pdf"'
            }
        });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});