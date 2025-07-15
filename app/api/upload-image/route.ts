import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// Function to get admin client or fallback to regular client
async function getStorageClient() {
  try {
    const adminModule = await import("@/lib/supabase-admin");
    return adminModule.supabaseAdmin;
  } catch (error) {
    console.warn("Admin client not available, using regular client");
    return supabase;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get the uploaded file
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const userId = formData.get("userId") as string;

    if (!file || !userId) {
      return NextResponse.json(
        { error: "File and userId are required" },
        { status: 400 }
      );
    }

    // Verify user is master using regular client
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("role")
      .eq("id", userId)
      .single();

    if (userError || !user) {
      console.error("User validation error:", userError);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.role !== "master") {
      return NextResponse.json(
        { error: "Only masters can upload images" },
        { status: 403 }
      );
    }

    // Validate file
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Only image files are allowed" },
        { status: 400 }
      );
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size must be less than 5MB" },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const buffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(buffer);

    // Generate unique filename
    const fileName = `queue-${Date.now()}-${Math.random()
      .toString(36)
      .substring(2)}.jpg`;

    // Get storage client (admin if available, regular otherwise)
    const storageClient = await getStorageClient();

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await storageClient.storage
      .from("queue-images")
      .upload(fileName, fileBuffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return NextResponse.json(
        {
          error: "Upload failed",
          details: uploadError.message,
        },
        { status: 500 }
      );
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = storageClient.storage.from("queue-images").getPublicUrl(fileName);

    return NextResponse.json({ url: publicUrl });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get("url");
    const userId = searchParams.get("userId");

    if (!imageUrl || !userId) {
      return NextResponse.json(
        { error: "URL and userId are required" },
        { status: 400 }
      );
    }

    // Verify user is master using regular client
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("role")
      .eq("id", userId)
      .single();

    if (userError || !user || user.role !== "master") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Extract filename from URL
    const urlParts = imageUrl.split("/");
    const fileName = urlParts[urlParts.length - 1];

    // Get storage client (admin if available, regular otherwise)
    const storageClient = await getStorageClient();

    // Delete from Supabase Storage
    const { error: deleteError } = await storageClient.storage
      .from("queue-images")
      .remove([fileName]);

    if (deleteError) {
      console.error("Delete error:", deleteError);
      return NextResponse.json({ error: "Delete failed" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
