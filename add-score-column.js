import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mrievkfloftgpcmvjgwb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1yaWV2a2Zsb2Z0Z3BjbXZqZ3diIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxMzk1NzksImV4cCI6MjA4OTcxNTU3OX0._iXWHIXJTmLWBZNphksOcn6jemqEfer1eCeKx7velJg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function addScoreColumn() {
  try {
    // Try to add the score column using RPC
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE players ADD COLUMN score INTEGER DEFAULT 0;'
    });
    
    if (error) {
      console.log('RPC failed, trying direct approach...');
      console.error(error);
    } else {
      console.log('Score column added successfully!');
      return;
    }
    
    // Alternative: Try to update a player's score to force the column to exist
    console.log('Testing direct update...');
    const { error: updateError } = await supabase
      .from('players')
      .update({ score: 0 })
      .limit(1);
      
    if (updateError) {
      console.log('Direct update also failed:', updateError);
      console.log('You need to manually add the score column to your Supabase database.');
      console.log('Go to your Supabase dashboard > Database > SQL Editor and run:');
      console.log('ALTER TABLE players ADD COLUMN score INTEGER DEFAULT 0;');
    } else {
      console.log('Score column exists or was added successfully!');
    }
    
  } catch (err) {
    console.error('Error:', err);
  }
}

addScoreColumn();
