import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  serverTimestamp, 
  deleteDoc,
  addDoc
} from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';

// Project type definition
export interface Project {
  id?: string;
  title: string;
  description?: string;
  type?: string;
  audience?: string;
  features?: string[];
  designPreferences?: string[];
  technologies?: string[];
  timeline?: string;
  status: 'planning' | 'in-progress' | 'completed' | 'archived';
  owner: string;
  collaborators?: string[];
  createdAt?: any;
  updatedAt?: any;
  attachments?: {
    id: string;
    name: string;
    type: string;
    url: string;
  }[];
  conversation?: {
    messages: any[];
  };
}

/**
 * Create a new project in Firestore
 */
export async function createProject(projectData: Omit<Project, 'id' | 'owner' | 'createdAt' | 'updatedAt' | 'status'>) {
  try {
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      throw new Error('You must be logged in to create a project');
    }
    
    // Reference to the projects collection
    const projectsRef = collection(db, 'projects');
    
    // Prepare the project data
    const project = {
      ...projectData,
      owner: currentUser.uid,
      status: 'planning' as const,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    
    // Add the document to Firestore
    const docRef = await addDoc(projectsRef, project);
    
    return {
      id: docRef.id,
      ...project
    };
  } catch (error) {
    console.error('Error creating project:', error);
    throw error;
  }
}

/**
 * Update an existing project
 */
export async function updateProject(projectId: string, projectData: Partial<Project>) {
  try {
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      throw new Error('You must be logged in to update a project');
    }
    
    // Reference to the specific project document
    const projectRef = doc(db, 'projects', projectId);
    
    // Get the project to verify ownership
    const projectSnap = await getDoc(projectRef);
    
    if (!projectSnap.exists()) {
      throw new Error('Project not found');
    }
    
    const projectData = projectSnap.data() as Project;
    
    // Check if the current user is the owner or a collaborator
    if (projectData.owner !== currentUser.uid && 
        !projectData.collaborators?.includes(currentUser.uid)) {
      throw new Error('You do not have permission to update this project');
    }
    
    // Update the document
    await updateDoc(projectRef, {
      ...projectData,
      updatedAt: serverTimestamp()
    });
    
    return {
      id: projectId,
      ...projectData
    };
  } catch (error) {
    console.error('Error updating project:', error);
    throw error;
  }
}

/**
 * Get a specific project by ID
 */
export async function getProject(projectId: string) {
  try {
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      throw new Error('You must be logged in to view a project');
    }
    
    const projectRef = doc(db, 'projects', projectId);
    const projectSnap = await getDoc(projectRef);
    
    if (!projectSnap.exists()) {
      throw new Error('Project not found');
    }
    
    const projectData = projectSnap.data() as Project;
    
    // Check if the current user is the owner or a collaborator
    if (projectData.owner !== currentUser.uid && 
        !projectData.collaborators?.includes(currentUser.uid)) {
      throw new Error('You do not have permission to view this project');
    }
    
    return {
      id: projectId,
      ...projectData
    };
  } catch (error) {
    console.error('Error getting project:', error);
    throw error;
  }
}

/**
 * Get all projects for the current user
 */
export async function getUserProjects() {
  try {
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      throw new Error('You must be logged in to view your projects');
    }
    
    const projectsRef = collection(db, 'projects');
    
    // Query projects where the user is either the owner or a collaborator
    const q = query(
      projectsRef,
      where('owner', '==', currentUser.uid),
      orderBy('updatedAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    
    const projects = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Project[];
    
    // Get projects where the user is a collaborator
    const collaboratorQuery = query(
      projectsRef,
      where('collaborators', 'array-contains', currentUser.uid),
      orderBy('updatedAt', 'desc')
    );
    
    const collaboratorSnapshot = await getDocs(collaboratorQuery);
    
    const collaboratorProjects = collaboratorSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Project[];
    
    // Combine both sets of projects
    return [...projects, ...collaboratorProjects];
  } catch (error) {
    console.error('Error getting user projects:', error);
    throw error;
  }
}

/**
 * Delete a project
 */
export async function deleteProject(projectId: string) {
  try {
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      throw new Error('You must be logged in to delete a project');
    }
    
    const projectRef = doc(db, 'projects', projectId);
    const projectSnap = await getDoc(projectRef);
    
    if (!projectSnap.exists()) {
      throw new Error('Project not found');
    }
    
    const projectData = projectSnap.data() as Project;
    
    // Only the owner can delete a project
    if (projectData.owner !== currentUser.uid) {
      throw new Error('You do not have permission to delete this project');
    }
    
    await deleteDoc(projectRef);
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting project:', error);
    throw error;
  }
}

/**
 * Add a message to the project conversation
 */
export async function addProjectMessage(projectId: string, message: any) {
  try {
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      throw new Error('You must be logged in to add a message');
    }
    
    const projectRef = doc(db, 'projects', projectId);
    const projectSnap = await getDoc(projectRef);
    
    if (!projectSnap.exists()) {
      throw new Error('Project not found');
    }
    
    const projectData = projectSnap.data() as Project;
    
    // Check if the current user is the owner or a collaborator
    if (projectData.owner !== currentUser.uid && 
        !projectData.collaborators?.includes(currentUser.uid)) {
      throw new Error('You do not have permission to add messages to this project');
    }
    
    // Add the message to the conversation array
    const conversation = projectData.conversation || { messages: [] };
    conversation.messages.push({
      ...message,
      timestamp: serverTimestamp(),
      sender: currentUser.uid
    });
    
    // Update the project document
    await updateDoc(projectRef, {
      conversation,
      updatedAt: serverTimestamp()
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error adding message to project:', error);
    throw error;
  }
} 