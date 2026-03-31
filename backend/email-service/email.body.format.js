



export async function formate(body , user , thanks) {
    const bdy = 
`Hii ${user.firstName} ${user.lastName},

${body}

I’m a builder who turns ideas into real products — from winning the CodeFront Hackathon with an AI-powered platform to shipping full-stack MERN and Next.js applications.
Currently working as a Full Stack Developer intern and passionate about building impactful, scalable products.
If you ever need someone to build, collaborate, or bring an idea to life, feel free to reach out anytime.

— Rishikesh Kumar Yadav  
📞 +91 9801690166  
📄 Resume: https://drive.google.com/file/d/1fe2nqHjMeewb4veWsrw3zaI_0L8TvzYh/view
🔗 LinkedIn: https://www.linkedin.com/in/rishikesh-yadav-a059482b0/

${thanks} `



     return bdy
}