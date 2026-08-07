-- Minimal ACEMS seed data mapped from current mock data.

INSERT INTO users (id, full_name, email, role)
VALUES
  ('b1', 'Nike Digital', 'brand@nike.com', 'brand'),
  ('b2', 'Spotify Ads', 'ads@spotify.com', 'brand'),
  ('c1', 'Priya Sharma', 'priya@creator.com', 'creator'),
  ('c2', 'Alex Johnson', 'alex@creator.com', 'creator'),
  ('a1', 'System Admin', 'admin@acems.com', 'admin')
ON CONFLICT (id) DO NOTHING;

INSERT INTO campaigns (id, brand_id, title, description, platform, budget, deadline, status)
VALUES
  ('camp1', 'b1', 'Summer Fitness Challenge 2026', 'Promote new summer collection through fitness-focused content.', 'Instagram', 25000, '2026-06-30', 'active'),
  ('camp2', 'b2', 'Podcast Discovery Campaign', 'Drive awareness for new podcast features among Gen Z audience.', 'YouTube', 18000, '2026-05-15', 'active'),
  ('camp3', 'b1', 'Back to School Athletics', 'Target college students for back-to-school athletic gear.', 'TikTok', 15000, '2026-08-15', 'draft')
ON CONFLICT (id) DO NOTHING;

INSERT INTO campaign_requirements (id, campaign_id, requirement_text, sort_order)
VALUES
  ('creq1', 'camp1', '3 Instagram Reels', 1),
  ('creq2', 'camp1', 'Brand mentions in caption', 2),
  ('creq3', 'camp1', 'FTC disclosure', 3),
  ('creq4', 'camp2', '2 YouTube videos', 1),
  ('creq5', 'camp2', 'App walkthrough', 2),
  ('creq6', 'camp2', 'Discount code integration', 3),
  ('creq7', 'camp3', '5 TikTok videos', 1),
  ('creq8', 'camp3', 'Hashtag challenge participation', 2)
ON CONFLICT (id) DO NOTHING;

INSERT INTO contracts (id, campaign_id, brand_id, creator_id, status, payment_amount, created_at, locked_at, executed_at)
VALUES
  ('con1', 'camp1', 'b1', 'c1', 'locked', 8000, '2026-03-05', '2026-03-08', NULL),
  ('con2', 'camp2', 'b2', 'c2', 'executed', 6000, '2026-03-12', '2026-03-14', '2026-05-13'),
  ('con3', 'camp1', 'b1', 'c2', 'pending', 9000, '2026-03-18', NULL, NULL)
ON CONFLICT (id) DO NOTHING;

INSERT INTO contract_deliverables (id, contract_id, description, platform, deadline, status, submitted_at)
VALUES
  ('d1', 'con1', '3 Instagram Reels featuring summer collection', 'Instagram', '2026-06-15', 'submitted', '2026-06-12'),
  ('d2', 'con1', 'Brand mention in story', 'Instagram', '2026-06-20', 'pending', NULL),
  ('d3', 'con2', '2 YouTube videos with app walkthrough', 'YouTube', '2026-05-10', 'verified', '2026-05-08'),
  ('d4', 'con2', 'Discount code integration', 'YouTube', '2026-05-12', 'verified', '2026-05-11'),
  ('d5', 'con3', '3 Instagram Reels', 'Instagram', '2026-06-25', 'pending', NULL)
ON CONFLICT (id) DO NOTHING;

INSERT INTO contract_rules (id, contract_id, rule_type, description, passed)
VALUES
  ('r1', 'con1', 'deliverable', 'Platform must match Instagram', TRUE),
  ('r2', 'con1', 'deliverable', 'Post count >= 3', TRUE),
  ('r3', 'con1', 'deadline', 'Submitted before deadline', TRUE),
  ('r4', 'con1', 'compliance', 'FTC disclosure present', NULL),
  ('r5', 'con2', 'deliverable', 'Platform must match YouTube', TRUE),
  ('r6', 'con2', 'deliverable', 'Post count >= 2', TRUE),
  ('r7', 'con2', 'deadline', 'Submitted before deadline', TRUE),
  ('r8', 'con2', 'compliance', 'FTC disclosure present', TRUE),
  ('r9', 'con2', 'compliance', 'No prohibited content', TRUE),
  ('r10', 'con3', 'deliverable', 'Platform must match Instagram', NULL),
  ('r11', 'con3', 'deadline', 'Submitted before deadline', NULL),
  ('r12', 'con3', 'compliance', 'FTC disclosure present', NULL)
ON CONFLICT (id) DO NOTHING;

INSERT INTO decision_evaluations (id, contract_id, decision, confidence_score, processing_time_ms, evaluated_at)
VALUES
  ('dec1', 'con2', 'success', 1.0, 800, '2026-05-13')
ON CONFLICT (id) DO NOTHING;

INSERT INTO decision_reasons (id, decision_id, reason_text, sort_order)
VALUES
  ('dr1', 'dec1', 'All deliverables verified', 1),
  ('dr2', 'dec1', 'Submitted before deadline', 2),
  ('dr3', 'dec1', 'FTC disclosure present', 3),
  ('dr4', 'dec1', 'No prohibited content detected', 4)
ON CONFLICT (id) DO NOTHING;
