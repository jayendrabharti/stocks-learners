import ApiClient from "../utils/ApiClient";

export interface ProfilePictureUploadResponse {
  success: boolean;
  message: string;
  data?: {
    user: User;
    avatarUrl: string;
  };
  error?: string;
}

export interface ProfilePictureResponse {
  success: boolean;
  data?: {
    avatarUrl: string;
  };
  message?: string;
  error?: string;
}

export class ProfileApi {
  /**
   * Upload profile picture
   */
  static async uploadProfilePicture(file: File): Promise<ProfilePictureUploadResponse> {
    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await ApiClient.post("/profile/upload", formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error: any) {
      console.error("Error uploading profile picture:", error);
      throw new Error(
        error.response?.data?.message || "Failed to upload profile picture"
      );
    }
  }

  /**
   * Get profile picture URL
   */
  static async getProfilePicture(userId: string): Promise<string | null> {
    try {
      const response = await ApiClient.get(`/profile/avatar/${userId}`);
      if (response.data.success) {
        return response.data.data.avatarUrl;
      }
      return null;
    } catch (error) {
      console.error("Error fetching profile picture:", error);
      return null;
    }
  }

  /**
   * Delete profile picture
   */
  static async deleteProfilePicture(): Promise<boolean> {
    try {
      const response = await ApiClient.delete("/profile/upload");
      return response.data.success;
    } catch (error) {
      console.error("Error deleting profile picture:", error);
      throw new Error("Failed to delete profile picture");
    }
  }
}