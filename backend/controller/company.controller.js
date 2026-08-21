import Company from "../models/Company.js";

// GET /api/companies - list companies with search, pagination, and sorting
export const getCompanies = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 25,
      sort = "-createdAt",
      search = "",
      industry = "",
      employees = "",
      country = "",
    } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { industry: { $regex: search, $options: "i" } },
        { city: { $regex: search, $options: "i" } },
        { country: { $regex: search, $options: "i" } },
      ];
    }

    if (industry) {
      query.industry = { $regex: industry, $options: "i" };
    }

    if (country) {
      query.country = { $regex: country, $options: "i" };
    }

    if (employees) {
      if (employees === "500+") {
        query.$expr = {
          $gte: [
            { $convert: { input: "$employees", to: "int", onError: -1, onNull: -1 } },
            501
          ]
        };
      } else {
        const parts = employees.split("-");
        if (parts.length === 2) {
          const min = parseInt(parts[0]);
          const max = parseInt(parts[1]);
          if (!isNaN(min) && !isNaN(max)) {
            query.$expr = {
              $and: [
                {
                  $gte: [
                    { $convert: { input: "$employees", to: "int", onError: -1, onNull: -1 } },
                    min
                  ]
                },
                {
                  $lte: [
                    { $convert: { input: "$employees", to: "int", onError: -1, onNull: -1 } },
                    max
                  ]
                }
              ]
            };
          }
        }
      }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [companies, total] = await Promise.all([
      Company.find(query)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Company.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: companies,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// GET /api/companies/stats - analytics aggregations
export const getCompanyStats = async (req, res) => {
  try {
    const [total, industries, employeeCounts, countries] = await Promise.all([
      Company.countDocuments(),
      Company.aggregate([
        { $group: { _id: "$industry", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 6 }
      ]),
      Company.aggregate([
        { $group: { _id: "$employees", count: { $sum: 1 } } }
      ]),
      Company.aggregate([
        { $group: { _id: "$country", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 6 }
      ])
    ]);

    // Categorize employee counts in Node.js
    const employeeCategories = {
      "1-10": 0,
      "11-50": 0,
      "51-200": 0,
      "201-500": 0,
      "500+": 0,
    };
    employeeCounts.forEach((e) => {
      const val = parseInt(e._id);
      if (isNaN(val)) return;
      if (val <= 10) employeeCategories["1-10"] += e.count;
      else if (val <= 50) employeeCategories["11-50"] += e.count;
      else if (val <= 200) employeeCategories["51-200"] += e.count;
      else if (val <= 500) employeeCategories["201-500"] += e.count;
      else employeeCategories["500+"] += e.count;
    });

    res.json({
      success: true,
      data: {
        total,
        industries: industries.map(ind => ({ name: ind._id || "Unknown", count: ind.count })),
        employeeBreakdown: employeeCategories,
        countries: countries.map(c => ({ name: c._id || "Unknown", count: c.count }))
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// GET /api/companies/:id - details of single company
export const getCompanyById = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) {
      return res.status(404).json({ success: false, error: "Company not found" });
    }
    res.json({ success: true, data: company });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// PATCH /api/companies/:id - update company properties
export const updateCompany = async (req, res) => {
  try {
    const company = await Company.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!company) {
      return res.status(404).json({ success: false, error: "Company not found" });
    }
    res.json({ success: true, data: company });
  } catch (error) {
    res.status(550).json({ success: false, error: error.message });
  }
};

// DELETE /api/companies/:id - delete company profile
export const deleteCompany = async (req, res) => {
  try {
    const company = await Company.findByIdAndDelete(req.params.id);
    if (!company) {
      return res.status(404).json({ success: false, error: "Company not found" });
    }
    res.json({ success: true, message: "Company profile deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
