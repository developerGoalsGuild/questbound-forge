"""
Unit tests for Quest Reward Calculator.

Tests the automatic reward XP calculation based on:
- Base XP: 50
- Scope multiplier (linear): Number of items in scope
- Period multiplier (square root): Compensates for longer periods
- Difficulty weights: Tasks = 1x, Goals = 2x, Guild quests = 3x
"""

import pytest
import math
from app.utils.reward_calculator import (
    calculate_quest_reward,
    BASE_XP,
    MIN_REWARD_XP,
    MAX_REWARD_XP,
    TASK_WEIGHT,
    GOAL_WEIGHT,
    GUILD_QUEST_WEIGHT
)


class TestRewardCalculatorConstants:
    """Test reward calculator constants"""
    
    def test_base_xp(self):
        """Test base XP constant"""
        assert BASE_XP == 50
    
    def test_min_reward_xp(self):
        """Test minimum reward XP constant"""
        assert MIN_REWARD_XP == 0
    
    def test_max_reward_xp(self):
        """Test maximum reward XP constant"""
        assert MAX_REWARD_XP == 1000
    
    def test_task_weight(self):
        """Test task weight constant"""
        assert TASK_WEIGHT == 1.0
    
    def test_goal_weight(self):
        """Test goal weight constant"""
        assert GOAL_WEIGHT == 2.0
    
    def test_guild_quest_weight(self):
        """Test guild quest weight constant"""
        assert GUILD_QUEST_WEIGHT == 3.0


class TestLinkedQuestRewardCalculation:
    """Test reward calculation for linked quests"""
    
    def test_linked_quest_no_items(self):
        """Test linked quest with no linked items"""
        reward = calculate_quest_reward(
            kind="linked",
            linked_goal_ids=[],
            linked_task_ids=[],
            is_guild_quest=False
        )
        # Scope: 0 goals * 2 + 0 tasks * 1 = 0
        # Period: 1.0 (default)
        # Weight: 1.0 (user quest)
        # Reward: 50 * 0 * 1.0 * 1.0 = 0 → capped to MIN_REWARD_XP
        assert reward == MIN_REWARD_XP
    
    def test_linked_quest_one_goal(self):
        """Test linked quest with one goal"""
        reward = calculate_quest_reward(
            kind="linked",
            linked_goal_ids=["goal1"],
            linked_task_ids=[],
            is_guild_quest=False
        )
        # Scope: 1 goal * 2 = 2
        # Period: 1.0 (default)
        # Weight: 1.0 (user quest)
        # Reward: 50 * 2 * 1.0 * 1.0 = 100
        assert reward == 100
    
    def test_linked_quest_one_task(self):
        """Test linked quest with one task"""
        reward = calculate_quest_reward(
            kind="linked",
            linked_goal_ids=[],
            linked_task_ids=["task1"],
            is_guild_quest=False
        )
        # Scope: 1 task * 1 = 1
        # Period: 1.0 (default)
        # Weight: 1.0 (user quest)
        # Reward: 50 * 1 * 1.0 * 1.0 = 50
        assert reward == 50
    
    def test_linked_quest_three_goals_two_tasks(self):
        """Test linked quest with multiple goals and tasks"""
        reward = calculate_quest_reward(
            kind="linked",
            linked_goal_ids=["goal1", "goal2", "goal3"],
            linked_task_ids=["task1", "task2"],
            period_days=7,
            is_guild_quest=False
        )
        # Scope: 3 goals * 2 + 2 tasks * 1 = 8
        # Period: sqrt(7) ≈ 2.65
        # Weight: 1.0 (user quest)
        # Reward: 50 * 8 * 2.65 * 1.0 = 1060 → capped to 1000
        expected_reward = int(BASE_XP * 8 * math.sqrt(7) * 1.0)
        assert reward == min(expected_reward, MAX_REWARD_XP)
        assert reward == MAX_REWARD_XP  # Should be capped
    
    def test_linked_quest_with_period(self):
        """Test linked quest with period multiplier"""
        reward = calculate_quest_reward(
            kind="linked",
            linked_goal_ids=["goal1", "goal2"],
            linked_task_ids=[],
            period_days=30,
            is_guild_quest=False
        )
        # Scope: 2 goals * 2 = 4
        # Period: sqrt(30) ≈ 5.48
        # Weight: 1.0 (user quest)
        # Reward: 50 * 4 * 5.48 * 1.0 ≈ 1096 → capped to 1000
        expected_reward = int(BASE_XP * 4 * math.sqrt(30) * 1.0)
        assert reward == min(expected_reward, MAX_REWARD_XP)
        assert reward == MAX_REWARD_XP  # Should be capped


class TestQuantitativeQuestRewardCalculation:
    """Test reward calculation for quantitative quests"""
    
    def test_quantitative_quest_tasks_scope(self):
        """Test quantitative quest counting tasks"""
        reward = calculate_quest_reward(
            kind="quantitative",
            target_count=50,
            count_scope="completed_tasks",
            period_days=30,
            is_guild_quest=False
        )
        # Scope: 50 tasks * 1 (TASK_WEIGHT) = 50
        # Period: sqrt(30) ≈ 5.48
        # Weight: 1.0 (user quest)
        # Reward: 50 * 50 * 5.48 * 1.0 ≈ 13700 → capped to 1000
        expected_reward = int(BASE_XP * 50 * TASK_WEIGHT * math.sqrt(30) * 1.0)
        assert reward == min(expected_reward, MAX_REWARD_XP)
        assert reward == MAX_REWARD_XP
    
    def test_quantitative_quest_goals_scope(self):
        """Test quantitative quest counting goals"""
        reward = calculate_quest_reward(
            kind="quantitative",
            target_count=10,
            count_scope="completed_goals",
            period_days=7,
            is_guild_quest=False
        )
        # Scope: 10 goals * 2 (GOAL_WEIGHT) = 20
        # Period: sqrt(7) ≈ 2.65
        # Weight: 1.0 (user quest)
        # Reward: 50 * 20 * 2.65 * 1.0 = 2650 → capped to 1000
        expected_reward = int(BASE_XP * 10 * GOAL_WEIGHT * math.sqrt(7) * 1.0)
        assert reward == min(expected_reward, MAX_REWARD_XP)
        assert reward == MAX_REWARD_XP
    
    def test_quantitative_quest_small_target(self):
        """Test quantitative quest with small target count"""
        reward = calculate_quest_reward(
            kind="quantitative",
            target_count=5,
            count_scope="completed_tasks",
            period_days=1,
            is_guild_quest=False
        )
        # Scope: 5 tasks * 1 = 5
        # Period: sqrt(1) = 1.0
        # Weight: 1.0 (user quest)
        # Reward: 50 * 5 * 1.0 * 1.0 = 250
        assert reward == 250
    
    def test_quantitative_quest_no_period(self):
        """Test quantitative quest without period"""
        reward = calculate_quest_reward(
            kind="quantitative",
            target_count=10,
            count_scope="completed_tasks",
            period_days=None,
            is_guild_quest=False
        )
        # Scope: 10 tasks * 1 = 10
        # Period: 1.0 (default when None)
        # Weight: 1.0 (user quest)
        # Reward: 50 * 10 * 1.0 * 1.0 = 500
        assert reward == 500


class TestGuildQuestRewardCalculation:
    """Test reward calculation for guild quests"""
    
    def test_guild_quantitative_quest(self):
        """Test guild quantitative quest"""
        reward = calculate_quest_reward(
            kind="quantitative",
            target_count=10,
            count_scope="goals",
            period_days=90,
            is_guild_quest=True
        )
        # Scope: 10 goals * 2 (GOAL_WEIGHT) = 20
        # Period: sqrt(90) ≈ 9.49
        # Weight: 3.0 (GUILD_QUEST_WEIGHT)
        # Reward: 50 * 20 * 9.49 * 3.0 ≈ 28470 → capped to 1000
        expected_reward = int(BASE_XP * 10 * GOAL_WEIGHT * math.sqrt(90) * GUILD_QUEST_WEIGHT)
        assert reward == min(expected_reward, MAX_REWARD_XP)
        assert reward == MAX_REWARD_XP
    
    def test_guild_percentual_goal_task_completion(self):
        """Test guild percentual quest with goal_task_completion"""
        reward = calculate_quest_reward(
            kind="percentual",
            linked_goal_ids=["goal1", "goal2"],
            linked_task_ids=["task1"],
            percentual_type="goal_task_completion",
            percentual_count_scope="both",
            period_days=30,
            is_guild_quest=True
        )
        # Scope: (2 goals * 2 + 1 task * 1) = 5
        # Period: sqrt(30) ≈ 5.48
        # Weight: 3.0 (GUILD_QUEST_WEIGHT)
        # Reward: 50 * 5 * 5.48 * 3.0 ≈ 4110 → capped to 1000
        expected_reward = int(BASE_XP * 5 * math.sqrt(30) * GUILD_QUEST_WEIGHT)
        assert reward == min(expected_reward, MAX_REWARD_XP)
        assert reward == MAX_REWARD_XP
    
    def test_guild_percentual_member_completion(self):
        """Test guild percentual quest with member_completion"""
        reward = calculate_quest_reward(
            kind="percentual",
            percentual_type="member_completion",
            member_total=50,
            period_days=7,
            is_guild_quest=True
        )
        # Scope: 50 members
        # Period: sqrt(7) ≈ 2.65
        # Weight: 3.0 (GUILD_QUEST_WEIGHT)
        # Reward: 50 * 50 * 2.65 * 3.0 ≈ 19875 → capped to 1000
        expected_reward = int(BASE_XP * 50 * math.sqrt(7) * GUILD_QUEST_WEIGHT)
        assert reward == min(expected_reward, MAX_REWARD_XP)
        assert reward == MAX_REWARD_XP


class TestRewardCalculationEdgeCases:
    """Test edge cases and boundary conditions"""
    
    def test_zero_period_days(self):
        """Test with zero period days"""
        reward = calculate_quest_reward(
            kind="linked",
            linked_goal_ids=["goal1"],
            period_days=0,
            is_guild_quest=False
        )
        # Period multiplier should default to 1.0 for invalid periods
        # Scope: 1 goal * 2 = 2
        # Period: 1.0 (default for invalid)
        # Reward: 50 * 2 * 1.0 * 1.0 = 100
        assert reward == 100
    
    def test_negative_period_days(self):
        """Test with negative period days"""
        reward = calculate_quest_reward(
            kind="linked",
            linked_goal_ids=["goal1"],
            period_days=-1,
            is_guild_quest=False
        )
        # Period multiplier should default to 1.0 for invalid periods
        assert reward == 100
    
    def test_very_large_target_count(self):
        """Test with very large target count"""
        reward = calculate_quest_reward(
            kind="quantitative",
            target_count=10000,
            count_scope="completed_tasks",
            period_days=365,
            is_guild_quest=False
        )
        # Should be capped to MAX_REWARD_XP
        assert reward == MAX_REWARD_XP
    
    def test_very_long_period(self):
        """Test with very long period"""
        reward = calculate_quest_reward(
            kind="linked",
            linked_goal_ids=["goal1"],
            period_days=365,
            is_guild_quest=False
        )
        # Scope: 1 goal * 2 = 2
        # Period: sqrt(365) ≈ 19.1
        # Reward: 50 * 2 * 19.1 * 1.0 ≈ 1910 → capped to 1000
        expected_reward = int(BASE_XP * 2 * math.sqrt(365) * 1.0)
        assert reward == min(expected_reward, MAX_REWARD_XP)
        assert reward == MAX_REWARD_XP
    
    def test_minimum_reward_cap(self):
        """Test that rewards are never below MIN_REWARD_XP"""
        reward = calculate_quest_reward(
            kind="linked",
            linked_goal_ids=[],
            linked_task_ids=[],
            is_guild_quest=False
        )
        assert reward >= MIN_REWARD_XP
    
    def test_maximum_reward_cap(self):
        """Test that rewards never exceed MAX_REWARD_XP"""
        reward = calculate_quest_reward(
            kind="quantitative",
            target_count=1000,
            count_scope="completed_tasks",
            period_days=365,
            is_guild_quest=True
        )
        assert reward <= MAX_REWARD_XP
        assert reward == MAX_REWARD_XP


class TestRewardCalculationFormula:
    """Test the reward calculation formula components"""
    
    def test_formula_base_xp(self):
        """Verify base XP is always 50"""
        assert BASE_XP == 50
    
    def test_formula_scope_linear(self):
        """Verify scope is linear (no square, etc.)"""
        # Test that doubling items doubles scope (before weight application)
        reward1 = calculate_quest_reward(
            kind="linked",
            linked_goal_ids=["goal1"],
            is_guild_quest=False
        )
        reward2 = calculate_quest_reward(
            kind="linked",
            linked_goal_ids=["goal1", "goal2"],
            is_guild_quest=False
        )
        # Reward2 should be approximately 2x reward1 (before capping)
        # reward1 = 50 * 2 * 1.0 * 1.0 = 100
        # reward2 = 50 * 4 * 1.0 * 1.0 = 200
        assert reward2 == 2 * reward1
    
    def test_formula_period_square_root(self):
        """Verify period multiplier uses square root"""
        # Test that 4x period gives 2x multiplier (sqrt relationship)
        reward1 = calculate_quest_reward(
            kind="linked",
            linked_goal_ids=["goal1"],
            period_days=4,
            is_guild_quest=False
        )
        reward2 = calculate_quest_reward(
            kind="linked",
            linked_goal_ids=["goal1"],
            period_days=16,  # 4x the period
            is_guild_quest=False
        )
        # sqrt(16) / sqrt(4) = 4/2 = 2
        # So reward2 should be approximately 2x reward1 (before capping)
        # reward1 = 50 * 2 * sqrt(4) * 1.0 = 50 * 2 * 2 = 200
        # reward2 = 50 * 2 * sqrt(16) * 1.0 = 50 * 2 * 4 = 400
        assert reward2 == 2 * reward1
    
    def test_formula_difficulty_weights(self):
        """Verify difficulty weights are applied correctly"""
        # Task weight = 1x, Goal weight = 2x
        task_reward = calculate_quest_reward(
            kind="quantitative",
            target_count=10,
            count_scope="completed_tasks",
            is_guild_quest=False
        )
        goal_reward = calculate_quest_reward(
            kind="quantitative",
            target_count=10,
            count_scope="completed_goals",
            is_guild_quest=False
        )
        # goal_reward should be 2x task_reward (due to GOAL_WEIGHT = 2.0)
        assert goal_reward == 2 * task_reward

