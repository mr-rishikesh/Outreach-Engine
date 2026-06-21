



export async function formate(body , user , thanks) {
    const bdy = 
`Hii ${user.firstName} ${user.lastName},

${body} As a Full-Stack & AI Engineer with 6 months of industry experience, strong skills in React, Next.js, TypeScript, MERN, and Generative AI. I've won 1st place in two hackathons, including a ₹100K-winning project, and have built production-ready AI and web applications.

I'd love to contribute to ${user.companyName} and help build impactful products while continuing to grow as an engineer.
Would you be open to a quick conversation regarding any internship or entry-level opportunities?

— Rishikesh Kumar Yadav  
📞 +91 9801690166  
📄 Resume: https://drive.google.com/file/d/1lOSSLE44i3hSunanmqQE2zDpUo4uuxdM/view
🔗 LinkedIn: https://www.linkedin.com/in/rishikesh-yadav-a059482b0/

${thanks} `



     return bdy
}