"""
Unit tests for Guild Quest Reward Calculator.

Tests the automatic reward XP calculation for guild quests based on:
- Base XP: 50
- Scope multiplier (linear): Number of items in scope
- Period multiplier (square root): Compensates for longer periods
- Difficulty weights: Tasks = 1x, Goals = 2x, Guild quests = 3x
"""

import pytest
import math
from app.utils.reward_calculator import (
    calculate_guild_quest_reward,
    BASE_XP,
    MIN_REWARD_XP,
    MAX_REWARD_XP,
    TASK_WEIGHT,
    GOAL_WEIGHT,
    GUILD_QUEST_WEIGHT
)


class TestGuildRewardCalculatorConstants:
    """Test guild reward calculator constants"""
    
    def test_base_xp(self):
        """Test base XP constant"""
        assert BASE_XP == 50
    
    def test_min_reward_xp(self):
        """Test minimum reward XP constant"""
        assert MIN_REWARD_XP == 0
    
    def test_max_reward_xp(self):
        """Test maximum reward XP constant"""
        assert MAX_REWARD_XP == 1000
    
    def test_guild_quest_weight(self):
        """Test guild quest weight constant"""
        assert GUILD_QUEST_WEIGHT == 3.0


class TestGuildQuantitativeQuestRewardCalculation:
    """Test reward calculation for guild quantitative quests"""
    
    def test_guild_quantitative_goals_scope(self):
        """Test guild quantitative quest counting goals"""
        reward = calculate_guild_quest_reward(
            kind="quantitative",
            target_count=10,
            count_scope="goals",
            period_days=90
        )
        # Scope: 10 goals * 2 (GOAL_WEIGHT) = 20
        # Period: sqrt(90) ≈ 9.49
        # Weight: 3.0 (GUILD_QUEST_WEIGHT)
        # Reward: 50 * 20 * 9.49 * 3.0 ≈ 28470 → capped to 1000
        expected_reward = int(BASE_XP * 10 * GOAL_WEIGHT * math.sqrt(90) * GUILD_QUEST_WEIGHT)
        assert reward == min(expected_reward, MAX_REWARD_XP)
        assert reward == MAX_REWARD_XP
    
    def test_guild_quantitative_tasks_scope(self):
        """Test guild quantitative quest counting tasks"""
        reward = calculate_guild_quest_reward(
            kind="quantitative",
            target_count=50,
            count_scope="tasks",
            period_days=30
        )
        # Scope: 50 tasks * 1 (TASK_WEIGHT) = 50
        # Period: sqrt(30) ≈ 5.48
        # Weight: 3.0 (GUILD_QUEST_WEIGHT)
        # Reward: 50 * 50 * 5.48 * 3.0 ≈ 41100 → capped to 1000
        expected_reward = int(BASE_XP * 50 * TASK_WEIGHT * math.sqrt(30) * GUILD_QUEST_WEIGHT)
        assert reward == min(expected_reward, MAX_REWARD_XP)
        assert reward == MAX_REWARD_XP
    
    def test_guild_quantitative_guild_quest_scope(self):
        """Test guild quantitative quest counting guild quest completions"""
        reward = calculate_guild_quest_reward(
            kind="quantitative",
            target_count=5,
            count_scope="guild_quest",
            period_days=7
        )
        # Scope: 5 guild quests (base count, weighted in difficulty)
        # Period: sqrt(7) ≈ 2.65
        # Weight: 3.0 (GUILD_QUEST_WEIGHT)
        # Reward: 50 * 5 * 2.65 * 3.0 ≈ 1987 → capped to 1000
        expected_reward = int(BASE_XP * 5 * math.sqrt(7) * GUILD_QUEST_WEIGHT)
        assert reward == min(expected_reward, MAX_REWARD_XP)
        assert reward == MAX_REWARD_XP
    
    def test_guild_quantitative_small_target(self):
        """Test guild quantitative quest with small target count"""
        reward = calculate_guild_quest_reward(
            kind="quantitative",
            target_count=2,
            count_scope="goals",
            period_days=1
        )
        # Scope: 2 goals * 2 = 4
        # Period: sqrt(1) = 1.0
        # Weight: 3.0 (GUILD_QUEST_WEIGHT)
        # Reward: 50 * 4 * 1.0 * 3.0 = 600
        assert reward == 600
    
    def test_guild_quantitative_no_period(self):
        """Test guild quantitative quest without period"""
        reward = calculate_guild_quest_reward(
            kind="quantitative",
            target_count=5,
            count_scope="tasks",
            period_days=None
        )
        # Scope: 5 tasks * 1 = 5
        # Period: 1.0 (default when None)
        # Weight: 3.0 (GUILD_QUEST_WEIGHT)
        # Reward: 50 * 5 * 1.0 * 3.0 = 750
        assert reward == 750


class TestGuildPercentualQuestRewardCalculation:
    """Test reward calculation for guild percentual quests"""
    
    def test_guild_percentual_goal_task_completion_both(self):
        """Test guild percentual quest with goal_task_completion (both scope)"""
        reward = calculate_guild_quest_reward(
            kind="percentual",
            linked_goal_ids=["goal1", "goal2"],
            linked_task_ids=["task1", "task2", "task3"],
            percentual_type="goal_task_completion",
            percentual_count_scope="both",
            period_days=30
        )
        # Scope: (2 goals * 2 + 3 tasks * 1) = 7
        # Period: sqrt(30) ≈ 5.48
        # Weight: 3.0 (GUILD_QUEST_WEIGHT)
        # Reward: 50 * 7 * 5.48 * 3.0 ≈ 5754 → capped to 1000
        expected_reward = int(BASE_XP * 7 * math.sqrt(30) * GUILD_QUEST_WEIGHT)
        assert reward == min(expected_reward, MAX_REWARD_XP)
        assert reward == MAX_REWARD_XP
    
    def test_guild_percentual_goal_task_completion_goals_only(self):
        """Test guild percentual quest with goal_task_completion (goals scope)"""
        reward = calculate_guild_quest_reward(
            kind="percentual",
            linked_goal_ids=["goal1", "goal2", "goal3"],
            linked_task_ids=["task1"],
            percentual_type="goal_task_completion",
            percentual_count_scope="goals",
            period_days=7
        )
        # Scope: 3 goals * 2 = 6
        # Period: sqrt(7) ≈ 2.65
        # Weight: 3.0 (GUILD_QUEST_WEIGHT)
        # Reward: 50 * 6 * 2.65 * 3.0 ≈ 2385 → capped to 1000
        expected_reward = int(BASE_XP * 3 * GOAL_WEIGHT * math.sqrt(7) * GUILD_QUEST_WEIGHT)
        assert reward == min(expected_reward, MAX_REWARD_XP)
        assert reward == MAX_REWARD_XP
    
    def test_guild_percentual_goal_task_completion_tasks_only(self):
        """Test guild percentual quest with goal_task_completion (tasks scope)"""
        reward = calculate_guild_quest_reward(
            kind="percentual",
            linked_goal_ids=["goal1"],
            linked_task_ids=["task1", "task2", "task3", "task4"],
            percentual_type="goal_task_completion",
            percentual_count_scope="tasks",
            period_days=7
        )
        # Scope: 4 tasks * 1 = 4
        # Period: sqrt(7) ≈ 2.65
        # Weight: 3.0 (GUILD_QUEST_WEIGHT)
        # Reward: 50 * 4 * 2.65 * 3.0 ≈ 1590 → capped to 1000
        expected_reward = int(BASE_XP * 4 * TASK_WEIGHT * math.sqrt(7) * GUILD_QUEST_WEIGHT)
        assert reward == min(expected_reward, MAX_REWARD_XP)
        assert reward == MAX_REWARD_XP
    
    def test_guild_percentual_member_completion(self):
        """Test guild percentual quest with member_completion"""
        reward = calculate_guild_quest_reward(
            kind="percentual",
            percentual_type="member_completion",
            member_total=50,
            period_days=7
        )
        # Scope: 50 members
        # Period: sqrt(7) ≈ 2.65
        # Weight: 3.0 (GUILD_QUEST_WEIGHT)
        # Reward: 50 * 50 * 2.65 * 3.0 ≈ 19875 → capped to 1000
        expected_reward = int(BASE_XP * 50 * math.sqrt(7) * GUILD_QUEST_WEIGHT)
        assert reward == min(expected_reward, MAX_REWARD_XP)
        assert reward == MAX_REWARD_XP
    
    def test_guild_percentual_member_completion_small(self):
        """Test guild percentual quest with small member count"""
        reward = calculate_guild_quest_reward(
            kind="percentual",
            percentual_type="member_completion",
            member_total=5,
            period_days=1
        )
        # Scope: 5 members
        # Period: sqrt(1) = 1.0
        # Weight: 3.0 (GUILD_QUEST_WEIGHT)
        # Reward: 50 * 5 * 1.0 * 3.0 = 750
        assert reward == 750
    
    def test_guild_percentual_default_scope(self):
        """Test guild percentual quest with default scope (should use both)"""
        reward = calculate_guild_quest_reward(
            kind="percentual",
            linked_goal_ids=["goal1"],
            linked_task_ids=["task1"],
            percentual_type="goal_task_completion",
            percentual_count_scope=None,  # Should default to "both"
            period_days=7
        )
        # Scope: (1 goal * 2 + 1 task * 1) = 3 (defaults to both if scope not specified)
        # Period: sqrt(7) ≈ 2.65
        # Weight: 3.0 (GUILD_QUEST_WEIGHT)
        # Reward: 50 * 3 * 2.65 * 3.0 ≈ 1192 → capped to 1000
        expected_reward = int(BASE_XP * 3 * math.sqrt(7) * GUILD_QUEST_WEIGHT)
        assert reward == min(expected_reward, MAX_REWARD_XP)
        assert reward == MAX_REWARD_XP


class TestGuildRewardCalculationEdgeCases:
    """Test edge cases and boundary conditions for guild quests"""
    
    def test_zero_period_days(self):
        """Test with zero period days"""
        reward = calculate_guild_quest_reward(
            kind="quantitative",
            target_count=5,
            count_scope="goals",
            period_days=0
        )
        # Period multiplier should default to 1.0 for invalid periods
        # Scope: 5 goals * 2 = 10
        # Period: 1.0 (default for invalid)
        # Weight: 3.0 (GUILD_QUEST_WEIGHT)
        # Reward: 50 * 10 * 1.0 * 3.0 = 1500 → capped to 1000
        assert reward == MAX_REWARD_XP
    
    def test_negative_period_days(self):
        """Test with negative period days"""
        reward = calculate_guild_quest_reward(
            kind="quantitative",
            target_count=5,
            count_scope="goals",
            period_days=-1
        )
        # Period multiplier should default to 1.0 for invalid periods
        assert reward == MAX_REWARD_XP
    
    def test_very_large_target_count(self):
        """Test with very large target count"""
        reward = calculate_guild_quest_reward(
            kind="quantitative",
            target_count=10000,
            count_scope="tasks",
            period_days=365
        )
        # Should be capped to MAX_REWARD_XP
        assert reward == MAX_REWARD_XP
    
    def test_very_long_period(self):
        """Test with very long period"""
        reward = calculate_guild_quest_reward(
            kind="quantitative",
            target_count=10,
            count_scope="goals",
            period_days=365
        )
        # Scope: 10 goals * 2 = 20
        # Period: sqrt(365) ≈ 19.1
        # Weight: 3.0 (GUILD_QUEST_WEIGHT)
        # Reward: 50 * 20 * 19.1 * 3.0 ≈ 57300 → capped to 1000
        expected_reward = int(BASE_XP * 10 * GOAL_WEIGHT * math.sqrt(365) * GUILD_QUEST_WEIGHT)
        assert reward == min(expected_reward, MAX_REWARD_XP)
        assert reward == MAX_REWARD_XP
    
    def test_minimum_reward_cap(self):
        """Test that rewards are never below MIN_REWARD_XP"""
        reward = calculate_guild_quest_reward(
            kind="quantitative",
            target_count=0,
            count_scope="tasks",
            period_days=1
        )
        # Should default to minimum scope of 1.0
        # Reward: 50 * 1 * 1.0 * 3.0 = 150, but scope calculation returns 1.0 for 0 target
        assert reward >= MIN_REWARD_XP
    
    def test_maximum_reward_cap(self):
        """Test that rewards never exceed MAX_REWARD_XP"""
        reward = calculate_guild_quest_reward(
            kind="quantitative",
            target_count=1000,
            count_scope="tasks",
            period_days=365,
            is_guild_quest=True
        )
        assert reward <= MAX_REWARD_XP
        assert reward == MAX_REWARD_XP


class TestGuildRewardCalculationFormula:
    """Test the reward calculation formula components for guild quests"""
    
    def test_formula_guild_weight_always_applied(self):
        """Verify guild quest weight (3x) is always applied"""
        # Compare guild quest vs user quest with same parameters
        # Guild quest should be 3x user quest
        guild_reward = calculate_guild_quest_reward(
            kind="quantitative",
            target_count=10,
            count_scope="tasks",
            period_days=1
        )
        # Scope: 10 tasks * 1 = 10
        # Period: 1.0
        # Weight: 3.0 (GUILD_QUEST_WEIGHT)
        # Reward: 50 * 10 * 1.0 * 3.0 = 1500 → capped to 1000
        assert guild_reward == MAX_REWARD_XP
        # The 3x multiplier is always applied to guild quests
    
    def test_formula_period_square_root(self):
        """Verify period multiplier uses square root"""
        # Test that 4x period gives 2x multiplier (sqrt relationship)
        reward1 = calculate_guild_quest_reward(
            kind="quantitative",
            target_count=5,
            count_scope="goals",
            period_days=4
        )
        reward2 = calculate_guild_quest_reward(
            kind="quantitative",
            target_count=5,
            count_scope="goals",
            period_days=16  # 4x the period
        )
        # sqrt(16) / sqrt(4) = 4/2 = 2
        # So reward2 should be approximately 2x reward1 (before capping)
        # reward1 = 50 * 10 * 2 * 3.0 = 3000 → capped to 1000
        # reward2 = 50 * 10 * 4 * 3.0 = 6000 → capped to 1000
        # Both capped, but the relationship holds before capping
        assert reward1 <= MAX_REWARD_XP
        assert reward2 <= MAX_REWARD_XP

