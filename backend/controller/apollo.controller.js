import Contact from "../models/Contacts.js";

// Call Apollo API to search for leads
export const searchLeads = async (req, res) => {
  try {
    const { 
      q_keywords, 
      person_titles, 
      person_locations,
      page = 1,
      per_page = 10
    } = req.body;

    const apiKey = process.env.APOLLO_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ success: false, error: "Apollo API Key is not configured in the backend." });
    }

    const apolloPayload = {
      api_key: apiKey,
      page,
      per_page
    };

    if (q_keywords) apolloPayload.q_keywords = q_keywords;
    if (person_titles && person_titles.length > 0) apolloPayload.person_titles = person_titles;
    if (person_locations && person_locations.length > 0) apolloPayload.person_locations = person_locations;

    const response = await fetch("https://api.apollo.io/api/v1/mixed_people/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache"
      },
      body: JSON.stringify(apolloPayload)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Apollo API Error:", data);
      return res.status(response.status).json({ success: false, error: data.error || "Failed to fetch from Apollo API" });
    }

    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Error in searchLeads:", error);
    res.status(500).json({ success: false, error: "Server error during Apollo search" });
  }
};

// Import selected leads from Apollo into the database
export const importLeads = async (req, res) => {
  try {
    const { leads } = req.body;

    if (!leads || !Array.isArray(leads) || leads.length === 0) {
      return res.status(400).json({ success: false, error: "No leads provided for import" });
    }

    let inserted = 0;
    let skipped = 0;

    for (const lead of leads) {
      const apolloId = lead.id;
      const recordEmail = lead.email;

      if (!apolloId && !recordEmail) {
        skipped++;
        continue;
      }

      const filter = apolloId
        ? { apolloContactId: apolloId }
        : { email: recordEmail };

      const existing = await Contact.findOne(filter);
      if (existing) {
        skipped++;
        continue;
      }

      // Map Apollo response to our Contact model
      await Contact.create({
        firstName: lead.first_name,
        lastName: lead.last_name,
        title: lead.title,
        companyName: lead.organization ? lead.organization.name : "",
        companyNameForEmails: lead.organization ? lead.organization.name : "",
        email: lead.email,
        emailStatus: lead.email_status,
        contactOwner: "Imported via API",
        personLinkedinUrl: lead.linkedin_url,
        website: lead.organization ? lead.organization.website_url : "",
        companyLinkedinUrl: lead.organization ? lead.organization.linkedin_url : "",
        twitterUrl: lead.twitter_url,
        city: lead.city,
        state: lead.state,
        country: lead.country,
        apolloContactId: lead.id,
        apolloAccountId: lead.organization_id,
        industry: lead.organization ? lead.organization.industry : "",
        employees: lead.organization ? lead.organization.estimated_num_employees : "",
        outreachStatus: "NOT_SENT"
      });

      inserted++;
    }

    res.status(200).json({ success: true, inserted, skipped, total: leads.length });
  } catch (error) {
    console.error("Error in importLeads:", error);
    res.status(500).json({ success: false, error: "Server error during import" });
  }
};
