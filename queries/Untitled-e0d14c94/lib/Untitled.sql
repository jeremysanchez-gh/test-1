-- Second Gift · seed data
-- Run AFTER schema.sql, in the same place (Query Library resource query against retool_db).
-- Safe to re-run: it clears all six tables first.
-- All dates are relative to current_date, so "days since last gift" stays correct
-- whenever you record the demo.
--
-- What this stages for the demo (see DEMO STAGING section at the bottom):
--   * ~1,200 donors, ~3 years of gifts, 8 campaigns, ~35 pledges
--   * 14 donors deliberately left with a stale 'safe' tier, including two major
--     donors (Elena Marsh, Marcus Webb). The live wf_nightly_lapse_scan run
--     flips them to at_risk/watch on camera.
--   * 4 pledge installments due within 3 days and 2 overdue, so
--     wf_pledge_reminders has visible work to do.
--   * A lapsed major (the Calloway Foundation) already visible in the at-risk queue.

select setseed(0.42);

truncate donors, campaigns, gifts, pledges, acknowledgments, outreach restart identity cascade;

-- ---------------------------------------------------------------------------
-- Campaigns (ids 1-8, inserted in this exact order; gift mapping relies on it)
-- ---------------------------------------------------------------------------
insert into campaigns (name, description, goal_amount, start_date, end_date, status) values
  ('Annual Fund 2024',        'Core operating support for tutoring programs',            120000, '2024-01-01', '2024-12-31', 'completed'),
  ('Annual Fund 2025',        'Core operating support for tutoring programs',            140000, '2025-01-01', '2025-12-31', 'completed'),
  ('Annual Fund 2026',        'Core operating support for tutoring programs',            160000, '2026-01-01', '2026-12-31', 'active'),
  ('Spring Gala 2025',        'Annual benefit dinner and auction',                        45000, '2025-04-01', '2025-05-15', 'completed'),
  ('Spring Gala 2026',        'Annual benefit dinner and auction',                        50000, '2026-04-01', '2026-05-15', 'completed'),
  ('Giving Tuesday 2025',     'Year-end online giving push',                              25000, '2025-11-15', '2025-12-31', 'completed'),
  ('Back-to-School Drive 2026','Supplies and program fees for the fall semester',         30000, '2026-07-15', '2026-08-31', 'active'),
  ('Annual Fund 2023',        'Core operating support for tutoring programs',             90000, '2023-01-01', '2023-12-31', 'completed');

-- ---------------------------------------------------------------------------
-- Hand-crafted demo donors (ids 1-8). The demo script references these by name.
-- ---------------------------------------------------------------------------
insert into donors (first_name, last_name, email, phone, donor_type, giving_tier, donor_since, notes) values
  ('Elena',  'Marsh',    'elena.marsh@example.org',        '555-0101', 'individual', 'major',      (current_date - interval '26 months')::date, 'Met at 2024 gala. Cares about the reading program. Prefers email.'),
  ('Marcus', 'Webb',     'marcus.webb@example.org',        '555-0102', 'individual', 'major',      (current_date - interval '30 months')::date, 'Former board member. Gives via donor-advised fund.'),
  ('Priya',  'Raman',    'priya.raman@example.org',        '555-0103', 'individual', 'major',      (current_date - interval '23 months')::date, 'Quarterly giver. Sponsored two students in 2025.'),
  ('Calloway','Foundation','grants@callowayfdn.example.org','555-0104', 'foundation', 'major',      (current_date - interval '32 months')::date, 'Two general-support grants. Program officer changed in 2025.'),
  ('Dana',   'Ortiz',    'dana.ortiz@example.org',         '555-0105', 'individual', 'mid',        (current_date - interval '16 months')::date, 'Monthly pledge. Card failed recently?'),
  ('Sam',    'Becker',   'sam.becker@example.org',         '555-0106', 'individual', 'grassroots', (current_date - interval '2 months')::date,  'First gift via the public page.'),
  ('Grace',  'Lin',      'grace.lin@example.org',          '555-0107', 'individual', 'mid',        (current_date - interval '24 months')::date, 'Never misses a quarter. Volunteer tutor too.'),
  ('Tom',    'Alvarez',  'tom.alvarez@example.org',        '555-0108', 'individual', 'grassroots', (current_date - interval '25 months')::date, 'Gave once after the 2024 open house.');

-- Their gifts (campaign assigned by date, same mapping as generated gifts below)
insert into gifts (donor_id, campaign_id, amount, gift_date, payment_method, source)
select v.donor_id,
  case
    when v.gift_date between date '2025-11-15' and date '2025-12-31' then 6
    when v.gift_date between date '2025-04-01' and date '2025-05-15' then 4
    when v.gift_date between date '2026-04-01' and date '2026-05-15' then 5
    when v.gift_date >= date '2026-07-15'                            then 7
    when extract(year from v.gift_date) = 2023 then 8
    when extract(year from v.gift_date) = 2024 then 1
    when extract(year from v.gift_date) = 2025 then 2
    else 3
  end,
  v.amount, v.gift_date, v.payment_method, v.source
from (values
  -- Elena Marsh: rising major donor, then silence for 8 months
  (1, 5000.00,  (current_date - interval '26 months')::date, 'check', 'event'),
  (1, 5000.00,  (current_date - interval '20 months')::date, 'check', 'mail'),
  (1, 7500.00,  (current_date - interval '14 months')::date, 'check', 'event'),
  (1, 10000.00, (current_date - interval '8 months')::date,  'stock', 'staff_entry'),
  -- Marcus Webb: steady major, quiet for 7 months
  (2, 2500.00,  (current_date - interval '30 months')::date, 'check', 'mail'),
  (2, 2500.00,  (current_date - interval '24 months')::date, 'check', 'mail'),
  (2, 3000.00,  (current_date - interval '18 months')::date, 'check', 'mail'),
  (2, 3000.00,  (current_date - interval '12 months')::date, 'check', 'mail'),
  (2, 2000.00,  (current_date - interval '7 months')::date,  'check', 'mail'),
  -- Priya Raman: quarterly 1,500, last gift 5 months ago (watch for a major)
  (3, 1500.00,  (current_date - interval '23 months')::date, 'card', 'public_page'),
  (3, 1500.00,  (current_date - interval '20 months')::date, 'card', 'public_page'),
  (3, 1500.00,  (current_date - interval '17 months')::date, 'card', 'public_page'),
  (3, 1500.00,  (current_date - interval '14 months')::date, 'card', 'public_page'),
  (3, 1500.00,  (current_date - interval '11 months')::date, 'card', 'public_page'),
  (3, 1500.00,  (current_date - interval '8 months')::date,  'card', 'public_page'),
  (3, 1500.00,  (current_date - interval '5 months')::date,  'card', 'public_page'),
  -- Calloway Foundation: two grants, silent 20 months (lapsed for a major)
  (4, 15000.00, (current_date - interval '32 months')::date, 'check', 'mail'),
  (4, 15000.00, (current_date - interval '20 months')::date, 'check', 'mail'),
  -- Dana Ortiz: mid-tier, stopped 10 months ago (at_risk)
  (5, 250.00,   (current_date - interval '16 months')::date, 'card', 'public_page'),
  (5, 250.00,   (current_date - interval '13 months')::date, 'card', 'public_page'),
  (5, 250.00,   (current_date - interval '10 months')::date, 'card', 'public_page'),
  -- Sam Becker: brand-new donor
  (6, 50.00,    (current_date - interval '2 months')::date,  'card', 'public_page'),
  -- Grace Lin: loyal quarterly donor, current
  (7, 250.00,   (current_date - interval '22 months')::date, 'card', 'public_page'),
  (7, 250.00,   (current_date - interval '19 months')::date, 'card', 'public_page'),
  (7, 250.00,   (current_date - interval '16 months')::date, 'card', 'public_page'),
  (7, 250.00,   (current_date - interval '13 months')::date, 'card', 'public_page'),
  (7, 250.00,   (current_date - interval '10 months')::date, 'card', 'public_page'),
  (7, 250.00,   (current_date - interval '7 months')::date,  'card', 'public_page'),
  (7, 250.00,   (current_date - interval '4 months')::date,  'card', 'public_page'),
  (7, 250.00,   (current_date - interval '1 month')::date,   'card', 'public_page'),
  -- Tom Alvarez: classic one-and-done, 25 months ago (lapsed)
  (8, 100.00,   (current_date - interval '25 months')::date, 'card', 'event')
) as v(donor_id, amount, gift_date, payment_method, source);

-- ---------------------------------------------------------------------------
-- Generated donors (ids 9+). Personas drive gift counts and amounts:
--   ~55% one-and-done, ~25% occasional, ~15% loyal, ~5% major
-- ---------------------------------------------------------------------------
drop table if exists donor_gen;
create temporary table donor_gen as
select
  i,
  (array['Ava','Liam','Noah','Mia','Zoe','Eli','Ruth','Omar','Ivy','Max',
         'Leo','Nora','Jack','Rosa','Hugo','June','Cole','Vera','Owen','Faye',
         'Rhea','Seth','Lila','Drew','Nina','Kai','Tess','Joel','Wren','Beau',
         'Iris','Gus','Maya','Reid','Lena','Troy','Cora','Dean','Sage','Finn'])[1 + (i-1) % 40] as first_name,
  (array['Nguyen','Patel','Kim','Garcia','Okafor','Silva','Haddad','Novak','Ito','Bauer',
         'Reyes','Cohen','Dube','Fontaine','Grant','Hale','Iqbal','Jansen','Kaur','Lopez',
         'Mbeki','Nolan','Ochoa','Park','Quinn','Rossi','Sato','Tran','Ueda','Vargas',
         'Walsh','Xu','Yang','Zamora','Adler','Brooks','Costa','Duran','Ellis','Farah'])[1 + ((i-1) / 40) % 40] as last_name,
  (current_date - (90 + floor(random() * 1000))::int) as donor_since,
  random() as r_persona
from generate_series(1, 1192) as i;

insert into donors (first_name, last_name, email, donor_type, giving_tier, donor_since)
select
  first_name,
  last_name,
  lower(first_name || '.' || last_name || '.' || i || '@example.org'),
  case when r_persona >= 0.95 and random() < 0.15 then 'foundation' else 'individual' end,
  case
    when r_persona >= 0.95 then 'major'
    when r_persona >= 0.80 then 'mid'
    when r_persona >= 0.55 and random() < 0.30 then 'mid'
    else 'grassroots'
  end,
  donor_since
from donor_gen;

-- Gifts for generated donors
insert into gifts (donor_id, campaign_id, amount, gift_date, payment_method, source)
select
  d.id,
  case
    when g.gift_date between date '2025-11-15' and date '2025-12-31' then 6
    when g.gift_date between date '2025-04-01' and date '2025-05-15' then 4
    when g.gift_date between date '2026-04-01' and date '2026-05-15' then 5
    when g.gift_date >= date '2026-07-15'                            then 7
    when extract(year from g.gift_date) = 2023 then 8
    when extract(year from g.gift_date) = 2024 then 1
    when extract(year from g.gift_date) = 2025 then 2
    else 3
  end,
  g.amount,
  g.gift_date,
  g.payment_method,
  g.source
from donor_gen t
join donors d on d.email = lower(t.first_name || '.' || t.last_name || '.' || t.i || '@example.org')
cross join lateral (
  select
    (t.donor_since + floor(random() * greatest(current_date - t.donor_since, 1))::int)::date as gift_date,
    case
      when d.giving_tier = 'major' then round((1000 + random() * 9000) / 250) * 250
      when d.giving_tier = 'mid'   then round((100 + random() * 400) / 25) * 25
      else round((10 + random() * 90) / 5) * 5
    end as amount,
    case
      when random() < 0.70 then 'card'
      when random() < 0.87 then 'check'
      when random() < 0.95 then 'cash'
      else 'stock'
    end as payment_method,
    case
      when random() < 0.55 then 'public_page'
      when random() < 0.80 then 'mail'
      when random() < 0.95 then 'event'
      else 'staff_entry'
    end as source
  from generate_series(1,
    case
      when t.r_persona < 0.55 then 1
      when t.r_persona < 0.80 then 1 + ceil(random() * 3)::int
      when t.r_persona < 0.95 then 5 + ceil(random() * 7)::int
      else 3 + ceil(random() * 5)::int
    end)
) as g;

-- ---------------------------------------------------------------------------
-- Derived fields: first gifts, donor rollups, risk tiers
-- ---------------------------------------------------------------------------
update gifts set is_first_gift = true
where id in (
  select distinct on (donor_id) id from gifts order by donor_id, gift_date, id
);

update donors d set
  last_gift_date  = agg.last_gift,
  lifetime_giving = agg.total
from (
  select donor_id, max(gift_date) as last_gift, sum(amount) as total
  from gifts group by donor_id
) agg
where agg.donor_id = d.id;

-- Canonical risk-tier logic. wf_nightly_lapse_scan runs this exact same UPDATE.
-- Majors get tighter thresholds: their relationship has a stricter SLA.
update donors d set risk_tier =
  case
    when d.last_gift_date is null then 'new'
    when d.last_gift_date >= current_date - interval '90 days'
         and (select count(*) from gifts g where g.donor_id = d.id) = 1 then 'new'
    when d.giving_tier = 'major' then
      case
        when d.last_gift_date < current_date - interval '18 months' then 'lapsed'
        when d.last_gift_date < current_date - interval '6 months'  then 'at_risk'
        when d.last_gift_date < current_date - interval '4 months'  then 'watch'
        else 'safe'
      end
    else
      case
        when d.last_gift_date < current_date - interval '24 months' then 'lapsed'
        when d.last_gift_date < current_date - interval '9 months'  then 'at_risk'
        when d.last_gift_date < current_date - interval '6 months'  then 'watch'
        else 'safe'
      end
  end;

-- ---------------------------------------------------------------------------
-- Pledges: ~30 monthly pledges from healthy donors, plus staged demo pledges
-- ---------------------------------------------------------------------------
insert into pledges (donor_id, campaign_id, total_amount, installment_amount, frequency, next_due_date, remaining_balance, status)
select
  p.id, 3, p.amt * 12, p.amt, 'monthly',
  (current_date + (4 + floor(random() * 26))::int)::date,
  p.amt * 12 - p.amt * floor(random() * 6),
  'active'
from (
  select id, case when giving_tier = 'major' then 500 when giving_tier = 'mid' then 150 else 25 end as amt
  from donors
  where risk_tier = 'safe' and id > 8
  order by id
  limit 30
) p;

-- Staged: Grace Lin due in 2 days, Dana Ortiz 6 days overdue
insert into pledges (donor_id, campaign_id, total_amount, installment_amount, frequency, next_due_date, remaining_balance, status) values
  (7, 3, 1800, 150, 'monthly', (current_date + 2)::date, 900,  'active'),
  (5, 3, 1200, 100, 'monthly', (current_date - 6)::date, 700,  'active');

-- Staged: three more generated pledges land inside the 3-day reminder window
update pledges set next_due_date = (current_date + 1)::date
where id in (
  select id from pledges where status = 'active' and donor_id > 8 order by id limit 3
);

-- ---------------------------------------------------------------------------
-- Acknowledgments: receipts exist for the last 8 months of gifts
-- (the story: Second Gift's receipt workflow went live earlier this year)
-- ---------------------------------------------------------------------------
insert into acknowledgments (gift_id, donor_id, channel, template, status, sent_at)
select id, donor_id, 'email', 'standard_receipt', 'sent',
       gift_date::timestamp + interval '9 hours'
from gifts
where gift_date >= (current_date - interval '8 months')::date;

-- ---------------------------------------------------------------------------
-- Outreach history: enough rows that the Outreach tab looks lived-in
-- ---------------------------------------------------------------------------
insert into outreach (donor_id, type, status, subject, body, created_by, created_at, sent_at)
select donor_id, 'pledge_reminder', 'sent',
       'Your Harbor Youth pledge',
       'Hi ' || d.first_name || ', a friendly reminder that your monthly pledge installment is coming up. Thank you for sticking with our students.',
       'workflow', now() - interval '12 days', now() - interval '12 days'
from (select donor_id from pledges where status = 'active' and donor_id > 8 limit 6) p
join donors d on d.id = p.donor_id;

insert into outreach (donor_id, type, status, subject, body, created_by, created_at, sent_at) values
  (8, 're_engagement', 'draft',
   'We still think about the open house',
   'Hi Tom, you came to our 2024 open house and helped us stock the fall reading room. Two years later that room serves 60 kids a week. We would love to have you back this fall. Could we send you a quick update on what your gift built?',
   'agent', now() - interval '9 days', null),
  (4, 're_engagement', 'draft',
   'An update for the Calloway Foundation',
   'Hello, we wanted to share results from the two years of general support the Calloway Foundation provided. Reading scores in our program rose 14 percent. We would welcome the chance to brief your new program officer.',
   'agent', now() - interval '9 days', null),
  (3, 'thank_you', 'sent',
   'Thank you from Harbor Youth',
   'Priya, thank you for another quarter of support. Your sponsorship keeps two students in daily tutoring. It matters.',
   'staff', now() - interval '4 months', now() - interval '4 months'),
  (2, 'thank_you', 'sent',
   'Grateful for your continued support',
   'Marcus, thank you for this year''s gift through your fund. The board misses you. Coffee soon?',
   'staff', now() - interval '7 months', now() - interval '7 months'),
  (6, 'thank_you', 'sent',
   'Welcome to Harbor Youth',
   'Sam, thanks for your first gift. Here is what it does: one month of workbooks for a student in our program. Welcome aboard.',
   'workflow', now() - interval '2 months', now() - interval '2 months'),
  (5, 're_engagement', 'dismissed',
   'Checking in',
   'Dana, we noticed your card on file may have expired. No pressure at all, but if you would like to keep your pledge going we can send a fresh link.',
   'agent', now() - interval '3 months', null);

-- ---------------------------------------------------------------------------
-- DEMO STAGING: leave 14 donors with a stale 'safe' tier so the live
-- wf_nightly_lapse_scan run visibly re-flags them on camera.
-- Elena Marsh (1) and Marcus Webb (2) are the headline flips.
-- ---------------------------------------------------------------------------
update donors set risk_tier = 'safe' where id in (1, 2);

update donors set risk_tier = 'safe'
where id in (
  select id from donors
  where risk_tier in ('at_risk', 'watch') and giving_tier <> 'major' and id > 8
  order by random()
  limit 12
);

drop table if exists donor_gen;

-- ---------------------------------------------------------------------------
-- Verification (run these after seeding; expected shapes in build-plan.md)
-- ---------------------------------------------------------------------------
-- select 'donors' t, count(*) from donors union all
-- select 'gifts', count(*) from gifts union all
-- select 'pledges', count(*) from pledges union all
-- select 'acknowledgments', count(*) from acknowledgments union all
-- select 'outreach', count(*) from outreach;
-- select risk_tier, count(*) from donors group by 1 order by 2 desc;
-- select first_name, last_name, giving_tier, last_gift_date, lifetime_giving
--   from donors where giving_tier = 'major' and risk_tier in ('at_risk','lapsed');
