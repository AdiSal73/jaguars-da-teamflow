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
        let yPos = 20;

        // Helper function to add text with word wrapping
        const addWrappedText = (text, x, y, maxWidth, fontSize = 10, fontStyle = 'normal') => {
            doc.setFontSize(fontSize);
            doc.setFont('helvetica', fontStyle);
            const lines = doc.splitTextToSize(text, maxWidth);
            doc.text(lines, x, y);
            return y + (lines.length * fontSize * 0.5);
        };

        // Header with gradient effect (simulated with rectangles)
        doc.setFillColor(16, 185, 129); // Emerald
        doc.rect(0, 0, pageWidth, 50, 'F');
        
        // Title
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(28);
        doc.setFont('helvetica', 'bold');
        doc.text('Individual Development Program', pageWidth / 2, 25, { align: 'center' });
        
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text('Michigan Jaguars Training System', pageWidth / 2, 35, { align: 'center' });

        // Reset text color
        doc.setTextColor(0, 0, 0);
        yPos = 65;

        // Introduction
        doc.setFontSize(11);
        doc.setFont('helvetica', 'italic');
        const intro = 'Our Individual Development Program (IDP) is designed to transform players into game-changers through three core pillars of excellence. Each component works together to create a comprehensive training experience that develops technical mastery, tactical intelligence, and performance optimization.';
        yPos = addWrappedText(intro, 15, yPos, pageWidth - 30, 11, 'italic');
        yPos += 15;

        // Section 1: Reflexive Skill Development
        doc.setFillColor(16, 185, 129);
        doc.rect(15, yPos, 5, 8, 'F');
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(16, 185, 129);
        doc.text('Reflexive Skill Development', 25, yPos + 6);
        yPos += 15;

        doc.setTextColor(0, 0, 0);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Enhance Muscle Memory & Precision Under Pressure', 15, yPos);
        yPos += 8;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        const reflexiveDesc = 'Reflexive skill development focuses on training your body to react instinctively and efficiently in high-pressure game situations. Through repetitive, progressive drills that simulate match conditions, players develop automatic responses that allow them to execute technical skills without conscious thought.';
        yPos = addWrappedText(reflexiveDesc, 15, yPos, pageWidth - 30);
        yPos += 8;

        // Key Components
        doc.setFont('helvetica', 'bold');
        doc.text('Key Training Components:', 15, yPos);
        yPos += 7;

        const reflexivePoints = [
            'Pressure Scenario Drills: Simulated game situations with defenders, time constraints, and decision-making elements',
            'Reaction Speed Training: Quick-fire exercises to develop split-second decision making and execution',
            'Technical Mastery: Progressive ball control, passing accuracy, shooting technique, and dribbling under pressure',
            'Cognitive Load Training: Multi-tasking drills that combine technical execution with tactical awareness',
            'Muscle Memory Development: Thousands of quality repetitions to automate proper technique'
        ];

        doc.setFont('helvetica', 'normal');
        reflexivePoints.forEach(point => {
            doc.circle(17, yPos - 1.5, 1, 'F');
            yPos = addWrappedText(point, 20, yPos, pageWidth - 35);
            yPos += 5;
        });

        // Check if we need a new page
        if (yPos > pageHeight - 40) {
            doc.addPage();
            yPos = 20;
        } else {
            yPos += 10;
        }

        // Section 2: Position-Specific Training
        doc.setFillColor(59, 130, 246); // Blue
        doc.rect(15, yPos, 5, 8, 'F');
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(59, 130, 246);
        doc.text('Position-Specific & Functional Training', 25, yPos + 6);
        yPos += 15;

        doc.setTextColor(0, 0, 0);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Tactical Mastery & Real-Game Coordination', 15, yPos);
        yPos += 8;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        const positionDesc = 'Position-specific training tailors development to the unique demands of each role on the field. Whether you\'re a defender reading attacks, a midfielder orchestrating play, or a forward creating goal-scoring opportunities, this training sharpens the tactical awareness and technical skills specific to your position.';
        yPos = addWrappedText(positionDesc, 15, yPos, pageWidth - 30);
        yPos += 8;

        doc.setFont('helvetica', 'bold');
        doc.text('Training Methodology:', 15, yPos);
        yPos += 7;

        const positionPoints = [
            'Small Group Scenarios: 3v3, 4v4, and position-specific group dynamics that mirror game situations',
            'Tactical Decision-Making: Pattern recognition, spacing, timing, and reading the game',
            'Role-Specific Techniques: Specialized skills for defenders, midfielders, forwards, and goalkeepers',
            'Functional Training: Coordinated movements with teammates in specific formations and systems',
            'Game Model Integration: Understanding team principles and individual responsibilities within the system'
        ];

        doc.setFont('helvetica', 'normal');
        positionPoints.forEach(point => {
            doc.circle(17, yPos - 1.5, 1, 'F');
            yPos = addWrappedText(point, 20, yPos, pageWidth - 35);
            yPos += 5;
        });

        // Check if we need a new page
        if (yPos > pageHeight - 60) {
            doc.addPage();
            yPos = 20;
        } else {
            yPos += 10;
        }

        // Section 3: Video Analysis
        doc.setFillColor(168, 85, 247); // Purple
        doc.rect(15, yPos, 5, 8, 'F');
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(168, 85, 247);
        doc.text('Video Analysis & Performance Evaluation', 25, yPos + 6);
        yPos += 15;

        doc.setTextColor(0, 0, 0);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Data-Driven Development & SMART Goal Setting', 15, yPos);
        yPos += 8;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        const videoDesc = 'Video analysis transforms subjective feedback into objective, measurable insights. By reviewing match and training footage with expert coaches, players gain a clear understanding of their performance, identify specific areas for improvement, and track progress over time with data-backed evidence.';
        yPos = addWrappedText(videoDesc, 15, yPos, pageWidth - 30);
        yPos += 8;

        doc.setFont('helvetica', 'bold');
        doc.text('Analysis Framework:', 15, yPos);
        yPos += 7;

        const videoPoints = [
            'Match Footage Review: Detailed analysis of training sessions and competitive matches',
            'Expert Annotations: Coach markup and commentary on key moments, decisions, and techniques',
            'Technical Assessment: Evaluation of first touch, passing, positioning, and movement patterns',
            'Tactical Evaluation: Analysis of decision-making, spatial awareness, and game understanding',
            'Performance Metrics: Quantifiable data on touches, passes, distances, and effectiveness',
            'SMART Development Plans: Specific, Measurable, Achievable, Relevant, Time-bound goals based on analysis'
        ];

        doc.setFont('helvetica', 'normal');
        videoPoints.forEach(point => {
            if (yPos > pageHeight - 15) {
                doc.addPage();
                yPos = 20;
            }
            doc.circle(17, yPos - 1.5, 1, 'F');
            yPos = addWrappedText(point, 20, yPos, pageWidth - 35);
            yPos += 5;
        });

        // Benefits Section
        if (yPos > pageHeight - 60) {
            doc.addPage();
            yPos = 20;
        } else {
            yPos += 15;
        }

        doc.setFillColor(234, 179, 8); // Amber
        doc.rect(0, yPos - 5, pageWidth, 0.5, 'F');
        yPos += 5;

        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(234, 179, 8);
        doc.text('The IDP Advantage', pageWidth / 2, yPos, { align: 'center' });
        yPos += 10;

        doc.setTextColor(0, 0, 0);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        const benefits = [
            'Personalized 1-on-1 Coaching: Individual attention tailored to your specific needs and goals',
            'Comprehensive Development: Technical, tactical, physical, and mental training in one system',
            'Data-Driven Progress Tracking: Measurable improvements with regular assessments and feedback',
            'Expert Coaching Staff: Experienced coaches with proven track records of player development',
            'Modern Training Tools: Video analysis platform, performance tracking, and digital resources',
            'Flexible Scheduling: Training sessions that work with your competitive schedule'
        ];

        benefits.forEach(benefit => {
            if (yPos > pageHeight - 15) {
                doc.addPage();
                yPos = 20;
            }
            doc.setFillColor(234, 179, 8);
            doc.circle(17, yPos - 1.5, 1, 'F');
            yPos = addWrappedText(benefit, 20, yPos, pageWidth - 35);
            yPos += 6;
        });

        // Footer
        const footerY = pageHeight - 20;
        doc.setFillColor(16, 185, 129);
        doc.rect(0, footerY - 5, pageWidth, 25, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Ready to Elevate Your Game?', pageWidth / 2, footerY + 2, { align: 'center' });
        
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text('Visit our booking system to schedule your first IDP session', pageWidth / 2, footerY + 8, { align: 'center' });
        doc.text('© 2026 Michigan Jaguars - Individual Development Program', pageWidth / 2, footerY + 13, { align: 'center' });

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