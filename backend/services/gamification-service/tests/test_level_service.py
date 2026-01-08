"""
Unit tests for level calculation service.
"""

import pytest
from app.services.level_service import (
    calculate_level, get_level_thresholds,
    calculate_xp_progress, get_level_info
)


class TestLevelCalculation:
    """Tests for level calculation functions."""
    
    def test_calculate_level_1(self):
        """Test level 1 calculation (0-99 XP)."""
        assert calculate_level(0) == 1
        assert calculate_level(50) == 1
        assert calculate_level(99) == 1
    
    def test_calculate_level_2(self):
        """Test level 2 calculation (100-399 XP)."""
        assert calculate_level(100) == 2
        assert calculate_level(200) == 2
        assert calculate_level(399) == 2
    
    def test_calculate_level_3(self):
        """Test level 3 calculation (400-899 XP)."""
        assert calculate_level(400) == 3
        assert calculate_level(600) == 3
        assert calculate_level(899) == 3
    
    def test_calculate_level_10(self):
        """Test level 10 calculation."""
        # Level 10 requires 8100 XP (9^2 * 100)
        assert calculate_level(8100) == 10
        # Level 11 requires 10000 XP (10^2 * 100)
        assert calculate_level(10000) == 11
    
    def test_calculate_level_negative_xp(self):
        """Test that negative XP defaults to level 1."""
        assert calculate_level(-100) == 1
    
    def test_get_level_thresholds_level_1(self):
        """Test level thresholds for level 1."""
        xp_current, xp_next = get_level_thresholds(1)
        assert xp_current == 0
        assert xp_next == 100
    
    def test_get_level_thresholds_level_2(self):
        """Test level thresholds for level 2."""
        xp_current, xp_next = get_level_thresholds(2)
        assert xp_current == 100
        assert xp_next == 400
    
    def test_get_level_thresholds_level_5(self):
        """Test level thresholds for level 5."""
        xp_current, xp_next = get_level_thresholds(5)
        assert xp_current == 1600  # (5-1)^2 * 100
        assert xp_next == 2500  # 5^2 * 100
    
    def test_calculate_xp_progress_level_1(self):
        """Test XP progress calculation for level 1."""
        # 50 XP out of 100 needed for level 2
        progress = calculate_xp_progress(50, 1)
        assert progress == 0.5
    
    def test_calculate_xp_progress_level_2(self):
        """Test XP progress calculation for level 2."""
        # 250 XP out of 300 needed for level 3 (400 - 100)
        progress = calculate_xp_progress(250, 2)
        assert abs(progress - (150 / 300)) < 0.01
    
    def test_calculate_xp_progress_at_level_threshold(self):
        """Test XP progress at level threshold."""
        # At exactly 100 XP (level 2 threshold)
        progress = calculate_xp_progress(100, 2)
        assert progress == 0.0  # Just reached level 2, no progress yet
    
    def test_calculate_xp_progress_max(self):
        """Test XP progress capped at 1.0."""
        # Way over the threshold
        progress = calculate_xp_progress(1000, 2)
        assert progress <= 1.0
    
    def test_get_level_info_level_1(self):
        """Test getting complete level info for level 1."""
        level, xp_current, xp_next, progress = get_level_info(50)
        assert level == 1
        assert xp_current == 0
        assert xp_next == 100
        assert progress == 0.5
    
    def test_get_level_info_level_2(self):
        """Test getting complete level info for level 2."""
        level, xp_current, xp_next, progress = get_level_info(250)
        assert level == 2
        assert xp_current == 100
        assert xp_next == 400
        assert 0.0 <= progress <= 1.0
    
    def test_get_level_info_level_10(self):
        """Test getting complete level info for level 10."""
        level, xp_current, xp_next, progress = get_level_info(8100)
        assert level == 10
        assert xp_current == 8100
        assert xp_next == 10000
    
    def test_get_level_info_level_11(self):
        """Test getting complete level info for level 11."""
        level, xp_current, xp_next, progress = get_level_info(10000)
        assert level == 11
        assert xp_current == 10000
        assert xp_next == 12100

