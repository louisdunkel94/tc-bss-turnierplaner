-- ═══════════════════════════════════════════════════════════════
--  DONATOCUP — Supabase Setup
--  Dieses SQL im Supabase SQL-Editor ausführen (supabase.com → Dashboard → SQL Editor)
-- ═══════════════════════════════════════════════════════════════

-- 1. PROFILES (erweitert auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id             UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email          TEXT NOT NULL,
  display_name   TEXT,
  gender         TEXT CHECK (gender IN ('herr', 'dame')),
  role           TEXT DEFAULT 'mitglied' CHECK (role IN ('admin', 'mitglied', 'veranstalter')),
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, display_name, gender)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'display_name',
    NEW.raw_user_meta_data->>'gender'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE handle_new_user();

-- 3. TOURNAMENTS
CREATE TABLE IF NOT EXISTS tournaments (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name                TEXT NOT NULL,
  created_by          UUID REFERENCES profiles(id),
  game_mode           TEXT DEFAULT 'geloste_paarungen'
                        CHECK (game_mode IN ('geloste_paarungen', 'gruppenphase_ko')),
  gender_requirement  TEXT DEFAULT 'mixed'
                        CHECK (gender_requirement IN ('mixed', 'herren', 'damen', 'offen')),
  skill_requirement   TEXT,
  start_at            TIMESTAMPTZ,
  duration_hours      INT DEFAULT 3,
  max_participants    INT DEFAULT 30,
  num_courts          INT DEFAULT 6,
  num_rounds          INT DEFAULT 5,
  status              TEXT DEFAULT 'draft'
                        CHECK (status IN ('draft', 'open', 'running', 'closed')),
  state               JSONB,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TOURNAMENT PARTICIPANTS
CREATE TABLE IF NOT EXISTS tournament_participants (
  tournament_id   UUID REFERENCES tournaments(id) ON DELETE CASCADE,
  user_id         UUID REFERENCES profiles(id) ON DELETE CASCADE,
  gender          TEXT CHECK (gender IN ('herr', 'dame')),
  registered_at   TIMESTAMPTZ DEFAULT NOW(),
  checked_in      BOOLEAN DEFAULT FALSE,
  checked_in_at   TIMESTAMPTZ,
  PRIMARY KEY (tournament_id, user_id)
);

-- ═══════════════════════════════════════════════════════════════
--  ROW LEVEL SECURITY
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_participants ENABLE ROW LEVEL SECURITY;

-- profiles: jeder sieht alle, nur eigenes bearbeitbar (Admins via service role)
CREATE POLICY "profiles_select_all" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Admin-Rolle-Änderungen: via service role (Edge Function oder Supabase Dashboard)
-- Alternativ: eigene Policy für Admins:
-- CREATE POLICY "profiles_update_admin" ON profiles FOR UPDATE
--   USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- tournaments: offene/laufende sehen alle angemeldeten Nutzer
CREATE POLICY "tournaments_select" ON tournaments FOR SELECT
  USING (
    status IN ('open', 'running', 'closed')
    OR auth.uid() = created_by
    OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );
CREATE POLICY "tournaments_insert" ON tournaments FOR INSERT
  WITH CHECK (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('veranstalter', 'admin')
  );
CREATE POLICY "tournaments_update" ON tournaments FOR UPDATE
  USING (
    auth.uid() = created_by
    OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- participants: eigene Anmeldungen verwalten
CREATE POLICY "participants_select" ON tournament_participants FOR SELECT USING (true);
CREATE POLICY "participants_insert" ON tournament_participants FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "participants_delete" ON tournament_participants FOR DELETE
  USING (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════
--  ERSTEN ADMIN anlegen (nach erster Registrierung ausführen)
-- ═══════════════════════════════════════════════════════════════
-- UPDATE profiles SET role = 'admin' WHERE email = 'deine@email.de';
