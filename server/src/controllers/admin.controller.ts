import { Request, Response } from "express";
import prisma from "../prisma/client.js";

// Get dashboard statistics
export const getDashboardStats = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const user = (req as any).user;

    if (!user || !user.isAdmin) {
      res.status(403).json({
        success: false,
        message: "Access denied. Admin only.",
      });
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalUsers, pendingContacts, totalContacts, newUsersToday] =
      await Promise.all([
        prisma.user.count(),
        prisma.contactForm.count({ where: { status: "PENDING" } }),
        prisma.contactForm.count(),
        prisma.user.count({
          where: {
            createdAt: {
              gte: today,
            },
          },
        }),
      ]);

    res.json({
      success: true,
      data: {
        totalUsers,
        pendingContacts,
        totalContacts,
        newUsersToday,
      },
    });
  } catch (error: any) {
    console.error("Get dashboard stats error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get all users with pagination
export const getAllUsers = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const user = (req as any).user;

    if (!user || !user.isAdmin) {
      res.status(403).json({
        success: false,
        message: "Access denied. Admin only.",
      });
      return;
    }

    const { page = 1, limit = 20, search } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};
    if (search) {
      where.OR = [
        { email: { contains: String(search), mode: "insensitive" } },
        { name: { contains: String(search), mode: "insensitive" } },
        { phone: { contains: String(search), mode: "insensitive" } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          isAdmin: true,
          createdAt: true,
          updatedAt: true,
          avatar: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      success: true,
      data: users,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error: any) {
    console.error("Get all users error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get single user details
export const getUserDetails = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const adminUser = (req as any).user;

    if (!adminUser || !adminUser.isAdmin) {
      res.status(403).json({
        success: false,
        message: "Access denied. Admin only.",
      });
      return;
    }

    const { id } = req.params;

    if (!id) {
      res.status(400).json({
        success: false,
        message: "User ID is required",
      });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        wallet: true,
        portfolios: {
          take: 10,
          orderBy: {
            updatedAt: "desc",
          },
        },
        transactions: {
          take: 10,
          orderBy: {
            executedAt: "desc",
          },
        },
        watchlists: {
          take: 10,
        },
      },
    });

    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error: any) {
    console.error("Get user details error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Update user (e.g., make admin)
export const updateUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const adminUser = (req as any).user;

    if (!adminUser || !adminUser.isAdmin) {
      res.status(403).json({
        success: false,
        message: "Access denied. Admin only.",
      });
      return;
    }

    const { id } = req.params;

    if (!id) {
      res.status(400).json({
        success: false,
        message: "User ID is required",
      });
      return;
    }

    const { isAdmin, name, email, phone } = req.body;

    const updateData: any = {};
    if (typeof isAdmin === "boolean") updateData.isAdmin = isAdmin;
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (phone) updateData.phone = phone;

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        isAdmin: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json({
      success: true,
      message: "User updated successfully",
      data: user,
    });
  } catch (error: any) {
    console.error("Update user error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Delete user
export const deleteUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const adminUser = (req as any).user;

    if (!adminUser || !adminUser.isAdmin) {
      res.status(403).json({
        success: false,
        message: "Access denied. Admin only.",
      });
      return;
    }

    const { id } = req.params;

    if (!id) {
      res.status(400).json({
        success: false,
        message: "User ID is required",
      });
      return;
    }

    // Prevent self-deletion
    if (id === adminUser.id) {
      res.status(400).json({
        success: false,
        message: "Cannot delete your own account",
      });
      return;
    }

    await prisma.user.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error: any) {
    console.error("Delete user error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};
