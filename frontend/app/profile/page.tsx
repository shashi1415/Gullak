"use client"

import { useEffect, useState, ChangeEvent } from "react"
import Navbar from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { motion } from "framer-motion"
import { User, Mail, Phone, MapPin, Building2, Edit } from "lucide-react"
import { auth, db } from "@/lib/firebase"
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth"
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore"

type ProfileData = {
  firstName: string
  lastName: string
  email: string
  phone: string
  city: string
  bank: string
  photoURL?: string
}

export default function ProfilePage() {
  const [user, setUser] = useState<FirebaseUser | null>(null)
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)

  const CLOUD_NAME = "dodf8oejq"
  const UPLOAD_PRESET = "profile_upload"

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u)
      if (u) {
        const docRef = doc(db, "users", u.uid)
        const docSnap = await getDoc(docRef)
        if (docSnap.exists()) {
          setProfile(docSnap.data() as ProfileData)
        } else {
          const newProfile: ProfileData = {
            firstName: u.displayName?.split(" ")[0] || "",
            lastName: u.displayName?.split(" ")[1] || "",
            email: u.email || "",
            phone: "",
            city: "",
            bank: "",
            photoURL: u.photoURL || "",
          }
          await setDoc(docRef, newProfile)
          setProfile(newProfile)
        }
      }
      setLoading(false)
    })
    return () => unsub()
  }, [])

  const handleSave = async () => {
    if (!user || !profile) return
    try {
      const docRef = doc(db, "users", user.uid)
      await updateDoc(docRef, profile)
      alert("Profile updated successfully!")
    } catch (err) {
      console.error(err)
      alert("Error updating profile.")
    }
  }

  // 🟡 IMAGE UPLOAD + PREVIEW
  const handleImageChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0] || !profile) return
    const file = e.target.files[0]

    // 🔹 Show preview immediately
    const previewURL = URL.createObjectURL(file)
    setPreview(previewURL)

    // 🔹 Upload to Cloudinary
    setUploading(true)
    const formData = new FormData()
    formData.append("file", file)
    formData.append("upload_preset", UPLOAD_PRESET)

    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
        method: "POST",
        body: formData,
      })
      const data = await res.json()
      if (data.secure_url) {
        setProfile({ ...profile, photoURL: data.secure_url })
        if (user) {
          const docRef = doc(db, "users", user.uid)
          await updateDoc(docRef, { photoURL: data.secure_url })
        }
        alert("Profile photo updated successfully!")
      } else {
        alert("Upload failed, please try again.")
      }
    } catch (err) {
      console.error(err)
      alert("Error uploading photo.")
    } finally {
      setUploading(false)
    }
  }

  if (loading) return <p className="text-center py-8">Loading profile...</p>

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="container mx-auto px-4 py-8 flex-1 max-w-4xl">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl lg:text-4xl font-bold mb-2">Your Profile</h1>
          <p className="text-muted-foreground">Manage your personal information and preferences</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-secondary mx-auto mb-4 flex items-center justify-center overflow-hidden">
                  {preview ? (
                    <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                  ) : profile?.photoURL ? (
                    <img src={profile.photoURL} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <User className="h-12 w-12 text-white" />
                  )}
                </div>
                <h2 className="text-xl font-bold mb-1">{profile?.firstName} {profile?.lastName}</h2>
                <p className="text-sm text-muted-foreground mb-4">{profile?.email}</p>

                {/* 🟢 Fixed Clickable File Input */}
                <input
                  type="file"
                  accept="image/*"
                  id="upload-photo"
                  onChange={handleImageChange}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  className="w-full gap-2 bg-transparent"
                  onClick={() => document.getElementById("upload-photo")?.click()}
                  disabled={uploading}
                >
                  <Edit className="h-4 w-4" /> {uploading ? "Uploading..." : "Change Photo"}
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Personal Information Section */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* First/Last Name */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="firstName"
                        value={profile?.firstName || ""}
                        onChange={(e) => setProfile({ ...profile!, firstName: e.target.value })}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={profile?.lastName || ""}
                      onChange={(e) => setProfile({ ...profile!, lastName: e.target.value })}
                    />
                  </div>
                </div>

                {/* Email, Phone, City, Bank */}
                {[
                  { id: "email", icon: Mail, value: profile?.email, type: "email" },
                  { id: "phone", icon: Phone, value: profile?.phone },
                  { id: "city", icon: MapPin, value: profile?.city },
                  { id: "bank", icon: Building2, value: profile?.bank },
                ].map(({ id, icon: Icon, value, type }) => (
                  <div className="space-y-2" key={id}>
                    <Label htmlFor={id}>{id.charAt(0).toUpperCase() + id.slice(1)}</Label>
                    <div className="relative">
                      <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id={id}
                        type={type || "text"}
                        value={value || ""}
                        onChange={(e) => setProfile({ ...profile!, [id]: e.target.value })}
                        className="pl-10"
                      />
                    </div>
                  </div>
                ))}

                <div className="flex gap-3 pt-4">
                  <Button className="flex-1" onClick={handleSave}>Save Changes</Button>
                  <Button variant="outline" className="flex-1 bg-transparent">Cancel</Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
