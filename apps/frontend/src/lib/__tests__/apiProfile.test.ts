import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checkNicknameAvailability } from '../apiProfile';
import { isNicknameAvailableForUser } from '../api';

// Mock the API module
vi.mock('../api', () => ({
  isNicknameAvailableForUser: vi.fn(),
  graphqlRaw: vi.fn(),
}));

const mockIsNicknameAvailableForUser = vi.mocked(isNicknameAvailableForUser);

describe('apiProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('checkNicknameAvailability', () => {
    it('should return true immediately when nickname equals current user nickname', async () => {
      const currentNickname = 'currentuser';
      const nickname = 'currentuser';

      const result = await checkNicknameAvailability(nickname, currentNickname);

      expect(result).toBe(true);
      expect(mockIsNicknameAvailableForUser).not.toHaveBeenCalled();
    });

    it('should return true immediately when nickname equals current user nickname (case sensitive)', async () => {
      const currentNickname = 'CurrentUser';
      const nickname = 'CurrentUser';

      const result = await checkNicknameAvailability(nickname, currentNickname);

      expect(result).toBe(true);
      expect(mockIsNicknameAvailableForUser).not.toHaveBeenCalled();
    });

    it('should call API when nickname is different from current user nickname', async () => {
      const currentNickname = 'currentuser';
      const nickname = 'newuser';
      mockIsNicknameAvailableForUser.mockResolvedValue(true);

      const result = await checkNicknameAvailability(nickname, currentNickname);

      expect(result).toBe(true);
      expect(mockIsNicknameAvailableForUser).toHaveBeenCalledWith(nickname);
    });

    it('should call API when nickname is different from current user nickname and return false if taken', async () => {
      const currentNickname = 'currentuser';
      const nickname = 'takenuser';
      mockIsNicknameAvailableForUser.mockResolvedValue(false);

      const result = await checkNicknameAvailability(nickname, currentNickname);

      expect(result).toBe(false);
      expect(mockIsNicknameAvailableForUser).toHaveBeenCalledWith(nickname);
    });

    it('should call API when no current nickname is provided', async () => {
      const nickname = 'newuser';
      mockIsNicknameAvailableForUser.mockResolvedValue(true);

      const result = await checkNicknameAvailability(nickname);

      expect(result).toBe(true);
      expect(mockIsNicknameAvailableForUser).toHaveBeenCalledWith(nickname);
    });

    it('should call API when current nickname is undefined', async () => {
      const currentNickname = undefined;
      const nickname = 'newuser';
      mockIsNicknameAvailableForUser.mockResolvedValue(true);

      const result = await checkNicknameAvailability(nickname, currentNickname);

      expect(result).toBe(true);
      expect(mockIsNicknameAvailableForUser).toHaveBeenCalledWith(nickname);
    });

    it('should call API when current nickname is empty string', async () => {
      const currentNickname = '';
      const nickname = 'newuser';
      mockIsNicknameAvailableForUser.mockResolvedValue(true);

      const result = await checkNicknameAvailability(nickname, currentNickname);

      expect(result).toBe(true);
      expect(mockIsNicknameAvailableForUser).toHaveBeenCalledWith(nickname);
    });

    it('should handle API errors gracefully', async () => {
      const currentNickname = 'currentuser';
      const nickname = 'newuser';
      const error = new Error('API Error');
      mockIsNicknameAvailableForUser.mockRejectedValue(error);

      await expect(checkNicknameAvailability(nickname, currentNickname)).rejects.toThrow('API Error');
      expect(mockIsNicknameAvailableForUser).toHaveBeenCalledWith(nickname);
    });

    it('should handle empty nickname input', async () => {
      const currentNickname = 'currentuser';
      const nickname = '';

      const result = await checkNicknameAvailability(nickname, currentNickname);

      expect(result).toBe(false);
      expect(mockIsNicknameAvailableForUser).not.toHaveBeenCalled();
    });

    it('should handle whitespace-only nickname input', async () => {
      const currentNickname = 'currentuser';
      const nickname = '   ';

      const result = await checkNicknameAvailability(nickname, currentNickname);

      expect(result).toBe(false);
      expect(mockIsNicknameAvailableForUser).not.toHaveBeenCalled();
    });
  });
});