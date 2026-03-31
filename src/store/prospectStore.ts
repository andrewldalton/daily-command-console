import { create } from 'zustand';

export interface Prospect {
  id: string;
  company: string;
  industry: string;
  employeeRange: string;
  signal: string;
  source: string;
  addedAt: string;
  status: 'active' | 'researched' | 'dismissed';
}

interface ProspectState {
  active: Prospect[];
  researched: Prospect[];
  pool: Prospect[];
  markResearched: (id: string) => void;
  dismissProspect: (id: string) => void;
  initProspects: () => void;
}

const STORAGE_KEY = 'dcc_prospects';

function makeProspect(
  company: string,
  industry: string,
  employeeRange: string,
  signal: string,
  source: string,
): Prospect {
  return {
    id: crypto.randomUUID(),
    company,
    industry,
    employeeRange,
    signal,
    source,
    addedAt: new Date().toISOString(),
    status: 'active',
  };
}

// 224 real Omaha-area prospects from benefits-ops DOL Form 5500 data
// Sorted by opportunity score (prime first, then high)
const BUILT_IN_POOL: Prospect[] = [
  makeProspect('Distribution Management Systems, Inc', 'Technology', '214-314', '264 employees. Score: 86/100 (prime). New broker (Da Davidson & Company) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Westin, Inc', 'Manufacturing', '222-322', '272 employees. Score: 86/100 (prime). New broker (Mariner Wealth Advisors LLC) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Millard Lumber Inc', 'Retail Trade', '239-339', '289 employees. Score: 86/100 (prime). New broker (Hub Investment Advisors) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Omaha National Group, Inc', 'Financial Services', '241-341', '291 employees. Score: 86/100 (prime). New broker (Proaccount) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Security National Bank of Omaha', 'Financial Services', '247-347', '297 employees. Score: 86/100 (prime). New broker (Lincoln National Corporation) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Mdwest One, P.c.', 'Healthcare', '249-349', '299 employees. Score: 86/100 (prime). New broker (Realize Wealth Manage Group) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('H & M Trucking, Inc', 'Transportation', '274-374', '324 employees. Score: 86/100 (prime). New broker (Fidelity Investments Institutional) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Orthowest, P.c.', 'Healthcare', '275-375', '325 employees. Score: 86/100 (prime). New broker (Empower Life & Annuity Ins CO) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Centris Federal Credit Union', 'Financial Services', '303-403', '353 employees. Score: 86/100 (prime). New broker (Capital Bank and Trust) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Memorial Community Hospital', 'Healthcare', '308-408', '358 employees. Score: 86/100 (prime). New broker (Union Bank & Trust Company) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Midwest Laboratories, Inc', 'Professional Services', '309-409', '359 employees. Score: 86/100 (prime). New broker (Cetera Investment Advisors LLC) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Riverside Technologies, Inc', 'Professional Services', '310-410', '360 employees. Score: 86/100 (prime). New broker (Creative Planning LLC) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Ventura Medstaff, LLC', 'Administrative Services', '312-412', '362 employees. Score: 86/100 (prime). New broker (Usi Securities INC) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Gottsch Employers Group, LLC', 'Professional Services', '324-424', '374 employees. Score: 86/100 (prime). New broker (Stancorp Financial Group) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Oncology Hematology West, P.c.', 'Healthcare', '330-430', '380 employees. Score: 86/100 (prime). New broker (Global Retirement Partners LLC) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Conductix, Inc', 'Manufacturing', '332-432', '382 employees. Score: 86/100 (prime). New broker (Strategic Advisors) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Goodwill Industries Inc Serving Eastern Nebraska and Southwest Iowa', 'Retail Trade', '337-437', '387 employees. Score: 86/100 (prime). New broker (Voya Retirement Insurance and Annui) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Nebraska Pediatric Practice, Inc', 'Healthcare', '346-446', '396 employees. Score: 86/100 (prime). New broker (Capfinancial Partners) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Bws Leasing, Inc', 'Real Estate', '353-453', '403 employees. Score: 86/100 (prime). New broker (Global Retirement Partners LLC) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Consolidated Supply Company, Inc', 'Wholesale Trade', '356-456', '406 employees. Score: 86/100 (prime). New broker (Da Davidson & Company) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Sojern, Inc', 'Professional Services', '363-463', '413 employees. Score: 86/100 (prime). New broker (World Investment Advisors LLC) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Bhj Usa, LLC', 'Manufacturing', '365-465', '415 employees. Score: 86/100 (prime). New broker (Adp) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Hill Brothers Transportation, Inc', 'Transportation', '373-473', '423 employees. Score: 86/100 (prime). New broker (John Hancock Life Insurance Company) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Busco INC Dba Arrow Stage Lines', 'Transportation', '380-480', '430 employees. Score: 86/100 (prime). New broker (Fiduciary Wise) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Great Plains Communications, LLC', 'Technology', '385-485', '435 employees. Score: 86/100 (prime). New broker (Bank of America) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Slosburg Company', 'Real Estate', '386-486', '436 employees. Score: 86/100 (prime). New broker (Tbs Agency) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Enterprise Properties, Inc', 'Manufacturing', '389-489', '439 employees. Score: 86/100 (prime). New broker (Usi Advisors) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Quality Brands Distribution, LLC', 'Wholesale Trade', '411-511', '461 employees. Score: 86/100 (prime). New broker (John Hancock Life Insurance Company) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Ehpv Management Group Inc', 'Professional Services', '419-519', '469 employees. Score: 86/100 (prime). New broker (Empower Financial Services) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Jtw Omaha Movers, Inc', 'Real Estate', '249-349', '299 employees. Score: 83/100 (prime). New broker (Admin. Group) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Cobalt Credit Union', 'Financial Services', '260-360', '310 employees. Score: 83/100 (prime). New broker (Grove Point Advisors LLC) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Nebraska Methodist Health Syst, Inc', 'Healthcare', '327-427', '377 employees. Score: 83/100 (prime). New broker (Willis Towers Watson Us LLC) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Claas of America Inc', 'Manufacturing', '371-471', '421 employees. Score: 83/100 (prime). New broker (Usi Advisors INC) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Carson Group Holdings, LLC', 'Financial Services', '382-482', '432 employees. Score: 83/100 (prime). New broker (Dwc - the 401(k) Experts) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Streck, LLC', 'Manufacturing', '386-486', '436 employees. Score: 83/100 (prime). New broker (John Hancock Retirement Plan Svcs.) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('City Ventures Professional Services, LLC', 'Management', '431-531', '481 employees. Score: 83/100 (prime). New broker (Voya Retirement Insurance & Annuity) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Golden Moments, LLC', 'Hospitality', '447-547', '497 employees. Score: 83/100 (prime). New broker (Mesirow) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Kbc, Inc', 'Wholesale Trade', '154-254', '204 employees. Score: 80/100 (high). New broker (Professional Retirement Strategies) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('The Schemmer Associates Inc', 'Professional Services', '165-265', '215 employees. Score: 80/100 (high). New broker (Karstens Investment Counsel) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Midwest Eye Care, P.c.', 'Healthcare', '167-267', '217 employees. Score: 80/100 (high). New broker (The Vanguard Group) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Wynne Transport Service, Inc', 'Transportation', '167-267', '217 employees. Score: 80/100 (high). New broker (Union Bank & Trust Company) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Baird Holm Llp', 'Professional Services', '168-268', '218 employees. Score: 80/100 (high). New broker (Usi Advisors) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Security Equipment, Inc', 'Professional Services', '170-270', '220 employees. Score: 80/100 (high). New broker (Creative Planning LLC) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Standard Heating & Air Conditioning, Inc', 'Construction', '173-273', '223 employees. Score: 80/100 (high). New broker (Ameritas Life Insurance CORP) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Peopleservice, Inc', 'Professional Services', '174-274', '224 employees. Score: 80/100 (high). New broker (Inspro) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Elliott Equipment Company', 'Manufacturing', '180-280', '230 employees. Score: 80/100 (high). New broker (Usi Advisors INC) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Cassling Diagnostic Imaging, Inc', 'Professional Services', '184-284', '234 employees. Score: 80/100 (high). New broker (D a Davidson and CO) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Boyd Jones Construction Co.', 'Construction', '187-287', '237 employees. Score: 80/100 (high). New broker (Ascensus LLC) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Borsheim Jewelry Company, Inc', 'Retail Trade', '190-290', '240 employees. Score: 80/100 (high). New broker (Lutz CO) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Hansen-mueller Co.', 'Wholesale Trade', '193-293', '243 employees. Score: 80/100 (high). New broker (Adp) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Elemental Scientific, Inc', 'Manufacturing', '193-293', '243 employees. Score: 80/100 (high). New broker (Ubs Financial Services INC) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Child Saving Institute, Inc', 'Healthcare', '195-295', '245 employees. Score: 80/100 (high). New broker (Da Davidson & Company) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Father Flanagan\'s Boys\' Home', 'Education', '319-419', '369 employees. Score: 79/100 (high). New broker (Vanguard Group) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Board of Trustees Plumbers Local Union No. 16 Defined Contribution Pla', 'Construction', '366-466', '416 employees. Score: 79/100 (high). New broker (Marquette Associates) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Jeo, Inc', 'Professional Services', '366-466', '416 employees. Score: 79/100 (high). New broker (Captrust Financial Advisors) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Thrasher, Inc', 'Construction', '447-547', '497 employees. Score: 79/100 (high). New broker (Wilshire Associates Incorporated) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Board of Trustees Plumbers Local Union No. 16 Welfare Fund', 'Construction', '448-548', '498 employees. Score: 79/100 (high). New broker (Aetna Life Insurance Company) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Milan Laser Holdings, LLC', 'Other Services', '1847-1947', '1897 employees. Score: 78/100 (high). New broker (Fidelity Workplace Services LLC) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Baxter Shared Services, LLC', 'Retail Trade', '1753-1853', '1803 employees. Score: 78/100 (high). New broker (Gallagher Benefit Services) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Orion Advisor Solutions, Inc', 'Finance & Insurance', '1667-1767', '1717 employees. Score: 78/100 (high). New broker (Principal Life Insurance Company) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Airlite Plastics Co.', 'Manufacturing', '1644-1744', '1694 employees. Score: 78/100 (high). New broker (Da Davidson & CO) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Greater Omaha Packing Co., Inc', 'Manufacturing', '1617-1717', '1667 employees. Score: 78/100 (high). New broker (Principal Life Insurance Company) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Immanuel', 'Healthcare', '1615-1715', '1665 employees. Score: 78/100 (high). New broker (Rbc Capital Markets LLC) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Midwest Medical Transport Company, LLC', 'Healthcare', '1576-1676', '1626 employees. Score: 78/100 (high). New broker (Usi Securities) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Data Axle, Inc', 'Information/Technology', '1550-1650', '1600 employees. Score: 78/100 (high). New broker (Merrill Lynch) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Gallup INC', 'Professional Services', '1462-1562', '1512 employees. Score: 78/100 (high). New broker (The Vanguard Group) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Woodhouse Ford Inc', 'Retail Trade', '1431-1531', '1481 employees. Score: 78/100 (high). New broker (Mutual of Omaha Investor Services) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Onestaff Medical, LLC', 'Healthcare', '1384-1484', '1434 employees. Score: 78/100 (high). New broker (Erisa Services Midwest) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Leo a Daly Company', 'Professional Services', '1273-1373', '1323 employees. Score: 78/100 (high). New broker (Empower Annuity Insurance Company O) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Otc Brands, Inc', 'Wholesale Trade', '1268-1368', '1318 employees. Score: 78/100 (high). New broker (Wilshire Advisors LLC) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Omaha Truck Center, Inc', 'Retail Trade', '1268-1368', '1318 employees. Score: 78/100 (high). New broker (Holmes Murphy & Associates) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Amcon Distributing Company', 'Wholesale Trade', '1267-1367', '1317 employees. Score: 78/100 (high). New broker (Wilshire Advisors LLC) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Green Plains Inc', 'Manufacturing', '1224-1324', '1274 employees. Score: 78/100 (high). New broker (Mercer Investments LLC) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Signature Performance, Inc', 'Finance & Insurance', '1207-1307', '1257 employees. Score: 78/100 (high). New broker (Bergankvd) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Kutak Rock Llp', 'Professional Services', '1205-1305', '1255 employees. Score: 78/100 (high). New broker (Charles Schwab) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('National Therapeutic Associates, Inc', 'Healthcare', '1083-1183', '1133 employees. Score: 78/100 (high). New broker (Wilshire Advisors LLC) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Dial Silvercrest CORP', 'Real Estate', '1041-1141', '1091 employees. Score: 78/100 (high). New broker (John Hancock Life Insurance Company) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Buildertrend Solutions, Inc', 'Construction', '1037-1137', '1087 employees. Score: 78/100 (high). New broker (Bridges Investment Management INC) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Applied Underwriters Inc', 'Management', '1033-1133', '1083 employees. Score: 78/100 (high). New broker (Cetera Investment Advisers LLC) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Lindsay Corporation', 'Manufacturing', '991-1091', '1041 employees. Score: 78/100 (high). New broker (Capfinancial Partners) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Tabor Street Group, LLC', 'Wholesale Trade', '952-1052', '1002 employees. Score: 78/100 (high). New broker (John Hancock) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Atlas Medstaff', 'Administrative Services', '947-1047', '997 employees. Score: 78/100 (high). New broker (Creative Planning) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Tenaska, Inc', 'Professional Services', '901-1001', '951 employees. Score: 78/100 (high). New broker (National Financial Services) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Titan Medical Group, LLC', 'Healthcare', '769-869', '819 employees. Score: 78/100 (high). New broker (Adp) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Seldin, LLC', 'Real Estate', '706-806', '756 employees. Score: 78/100 (high). New broker (Gallagher Fiduciary Advisors LLC) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Jet Linx Aviation, LLC', 'Transportation', '686-786', '736 employees. Score: 78/100 (high). New broker (The Vanguard Group) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Np Dodge Company', 'Real Estate', '668-768', '718 employees. Score: 78/100 (high). New broker (Hightower Advisors) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Malnove Holding Company, Inc', 'Manufacturing', '668-768', '718 employees. Score: 78/100 (high). New broker (John Hancock Retirement Svcs) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Cohere Beauty Holdings, LLC', 'Manufacturing', '667-767', '717 employees. Score: 78/100 (high). New broker (Hauser Retirement Solutions 2 LLC) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('American National Bank', 'Finance & Insurance', '664-764', '714 employees. Score: 78/100 (high). New broker (Usi Advisors INC) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Oneworld Community Health Centers, Inc', 'Healthcare', '658-758', '708 employees. Score: 78/100 (high). New broker (Global Retirement Partners LLC) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Nebraska Orthopaedic Hospital', 'Healthcare', '640-740', '690 employees. Score: 78/100 (high). New broker (Empower Life & Annuity Ins CO) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Boundless Enterprises, LLC', 'Hospitality', '628-728', '678 employees. Score: 78/100 (high). New broker (Wilshire Advisors LLC) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('H and H Automotive, LLC', 'Retail Trade', '586-686', '636 employees. Score: 78/100 (high). New broker (Benefit Plans INC) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Data Systems, Inc', 'Professional Services', '567-667', '617 employees. Score: 78/100 (high). New broker (Employee Benefit Management Service) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Road Safety Services, Inc', 'Construction', '562-662', '612 employees. Score: 78/100 (high). New broker (United of Omaha) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Drm, Inc', 'Hospitality', '560-660', '610 employees. Score: 78/100 (high). New broker (Lockton Companies) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Tsl Company Holdings, Ltd', 'Transportation', '528-628', '578 employees. Score: 78/100 (high). New broker (Nationwide Insurance) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Koley Jessen P.c., L.l.o. C/o Manager of Total Rewards', 'Professional Services', '216-316', '266 employees. Score: 78/100 (high). New broker (Hub Investment Advisors) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Union Pacific Corporation', 'Transportation', '240-340', '290 employees. Score: 78/100 (high). New broker (Vanguard Advisers INC) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Lt Holdings, Inc', 'Transportation', '254-354', '304 employees. Score: 78/100 (high). New broker (Usi Advisors INC) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Fremont Beef Company', 'Manufacturing', '260-360', '310 employees. Score: 78/100 (high). New broker (Principal Securities INC) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Omaha Track, Inc', 'Retail Trade', '292-392', '342 employees. Score: 78/100 (high). New broker (Prime Capital Investment Advisors) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Travelex Insurance Services, Inc', 'Financial Services', '347-447', '397 employees. Score: 78/100 (high). New broker (Hub Investment Advisors) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Phillips Manufacturing Co.', 'Manufacturing', '374-474', '424 employees. Score: 78/100 (high). New broker (Usi Advisors) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Mutual of Omaha Insurance Company', 'Financial Services', '379-479', '429 employees. Score: 78/100 (high). New broker (United of Omaha Life Insurance CO) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Southerncarlson, Inc', 'Wholesale Trade', '397-497', '447 employees. Score: 78/100 (high). New broker (T Rowe Price Rps INC) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Owen Industries, Inc', 'Manufacturing', '397-497', '447 employees. Score: 78/100 (high). New broker (United Healthcare Services) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Rotella\'s Italian Bakery, Inc', 'Manufacturing', '405-505', '455 employees. Score: 78/100 (high). New broker (Capfinancial Partners) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Omaha Zoological Society, Inc', 'Arts & Entertainment', '414-514', '464 employees. Score: 78/100 (high). New broker (Lincoln National Corporation) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Majors Plastics, Inc', 'Manufacturing', '447-547', '497 employees. Score: 78/100 (high). New broker (Usi Advisors INC) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Banyan Medical Solutions, LLC', 'Professional Services', '448-548', '498 employees. Score: 78/100 (high). New broker (Adp) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Advance Services, Inc', 'Professional Services', '155-255', '205 employees. Score: 77/100 (high). New broker (Gdp Advisors LLC) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Community Pharmacy Services, LLC', 'Retail Trade', '194-294', '244 employees. Score: 77/100 (high). New broker (Mesirow) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Project Harmony', 'Healthcare', '112-212', '162 employees. Score: 76/100 (high). New broker (Eide Bailly Cpas and Advisors) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Lti Technology Solutions, Inc', 'Professional Services', '112-212', '162 employees. Score: 76/100 (high). New broker (Two West Capital Investors) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Lumbermens Brick & Supply Dba Fireplace Stone and Patio', 'Wholesale Trade', '116-216', '166 employees. Score: 76/100 (high). New broker (Global Retirement Partners LLC) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Lgt Transport, LLC', 'Transportation', '120-220', '170 employees. Score: 76/100 (high). New broker (John Hancock Life Insuranc Company) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Prime Communications, Inc', 'Other Services', '126-226', '176 employees. Score: 76/100 (high). New broker (Wilshire Associates Incorporated) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Access Bank', 'Financial Services', '126-226', '176 employees. Score: 76/100 (high). New broker (Royal Wealth Management) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('American Laboratories Holdings, LLC', 'Manufacturing', '127-227', '177 employees. Score: 76/100 (high). New broker (The Vanguard Group) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Quantum Market Research, Inc', 'Technology', '129-229', '179 employees. Score: 76/100 (high). New broker (Pcs Retirement) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Lift Solutions, Inc', 'Wholesale Trade', '130-230', '180 employees. Score: 76/100 (high). New broker (Wilshire Associates Inc.) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('E & a Consulting Group, Inc', 'Professional Services', '132-232', '182 employees. Score: 76/100 (high). New broker (Empower Annuity Insurance Company) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Rural Media Group INC', 'Technology', '133-233', '183 employees. Score: 76/100 (high). New broker (Adp) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Alvine and Associates, Inc', 'Professional Services', '134-234', '184 employees. Score: 76/100 (high). New broker (Principal Life Insurance Company) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Core Bank', 'Financial Services', '140-240', '190 employees. Score: 76/100 (high). New broker (Security National Bank) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Proxibid, Inc', 'Professional Services', '165-265', '215 employees. Score: 76/100 (high). New broker (Adp) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Hunt Transportation, Inc', 'Transportation', '226-326', '276 employees. Score: 76/100 (high). New broker (Union Bank & Trust Company) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Burlington Capital Pm Group Inc', 'Real Estate', '291-391', '341 employees. Score: 76/100 (high). New broker (Ascensus LLC) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Omaha Steaks International, LLC', 'Manufacturing', '321-421', '371 employees. Score: 76/100 (high). New broker (Adp) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Structural Component Systems, Inc', 'Manufacturing', '398-498', '448 employees. Score: 76/100 (high). New broker (Union Bank & Trust Company) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Steamfitters and Plumbers Local Union No 464 401(k) Plan', 'Construction', '1537-1637', '1587 employees. Score: 75/100 (high). New broker (Blake & Uhlig) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Board of Trustees Steamfitters and Plumbers Local Union No 464 Welfare', 'Construction', '1425-1525', '1475 employees. Score: 75/100 (high). New broker (Benesys) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Nebraska Beef, Ltd.', 'Agriculture', '996-1096', '1046 employees. Score: 75/100 (high). New broker (Ascensus Holdings) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Board of Trustees Plumbers Local Union No. 16 Pension Plan', 'Construction', '799-899', '849 employees. Score: 75/100 (high). New broker (Kutak Rock) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Goodwill Specialty Services, Inc', 'Healthcare', '774-874', '824 employees. Score: 75/100 (high). New broker (Ascensus) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Leonard Management', 'Hospitality', '767-867', '817 employees. Score: 75/100 (high). New broker (Bank of America Na) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Contractors, Laborers, Teamsters,& Engineers Health & Welfare Plan', 'Construction', '697-797', '747 employees. Score: 75/100 (high). New broker (Blue Cross Blue Shield of Nebraska) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Wholestone Farms Cooperative, Inc', 'Manufacturing', '222-322', '272 employees. Score: 75/100 (high). New broker (Vpag LLC Dba Visionpoint Advisory G) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Midwest Gastrointestinal Assoc., Pc', 'Healthcare', '228-328', '278 employees. Score: 75/100 (high). New broker (Benefit Plans) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Riekes Equipment Company', 'Wholesale Trade', '248-348', '298 employees. Score: 75/100 (high). New broker (Stadion Money Management) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Visiting Nurse Association of the Midlands', 'Healthcare', '249-349', '299 employees. Score: 75/100 (high). New broker (D a Davidson & CO INC) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Quality Living INC', 'Healthcare', '268-368', '318 employees. Score: 75/100 (high). New broker (Hub Investment Advisors) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Builders Supply Co., Inc', 'Retail Trade', '277-377', '327 employees. Score: 75/100 (high). New broker (Umr INC) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Heartland Family Service', 'Nonprofit', '280-380', '330 employees. Score: 75/100 (high). New broker (Ascensus LLC) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Winnebago Tribe of Nebraska', 'Government', '288-388', '338 employees. Score: 75/100 (high). New broker (John Hancock Life Insurance Copmany) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Lozier Corporation', 'Manufacturing', '300-400', '350 employees. Score: 75/100 (high). New broker (Empower Annuity Insurance Company O) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Professional Research Consultants, Inc', 'Professional Services', '350-450', '400 employees. Score: 75/100 (high). New broker (Principal Life Insurance Company) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Fremont Contract Carriers, Inc', 'Transportation', '362-462', '412 employees. Score: 75/100 (high). New broker (Ascensus LLC) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('The James Skinner Co.', 'Manufacturing', '377-477', '427 employees. Score: 75/100 (high). New broker (Ascensus LLC) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Gregg Young Chevrolet, Inc', 'Retail Trade', '384-484', '434 employees. Score: 75/100 (high). New broker (Wealthplan Partners) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Hillcrest Health Services INC', 'Healthcare', '391-491', '441 employees. Score: 75/100 (high). New broker (American United Life Insurance CO) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Local 231 Ibew and Iowa Neca Sioux City Division Joint Board of Trust', 'Construction', '403-503', '453 employees. Score: 75/100 (high). New broker (Zenith American Solutions) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Think Whole Person Healthcare', 'Healthcare', '405-505', '455 employees. Score: 75/100 (high). New broker (Morningstar Investment Management L) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Standard Nutrition Company', 'Manufacturing', '405-505', '455 employees. Score: 75/100 (high). New broker (Wealthplan Partners LLC) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('The Lund Company', 'Real Estate', '409-509', '459 employees. Score: 75/100 (high). New broker (Silverstone Asset Management INC) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Secur-serv Inc', 'Other Services', '411-511', '461 employees. Score: 75/100 (high). New broker (Merrill Lynch) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('America\'s Fence Store INC', 'Construction', '244-344', '294 employees. Score: 74/100 (high). New broker (Voya Retirement Insurance & Annuity) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Pando, LLC', 'Administrative Services', '372-472', '422 employees. Score: 74/100 (high). New broker (North American Ktrade Alliance) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Bellevue University', 'Education', '429-529', '479 employees. Score: 74/100 (high). New broker (Silverstone Asset Management INC) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Fraser Stryker Pc Llo', 'Professional Services', '103-203', '153 employees. Score: 73/100 (high). New broker (Empower Annuity Insurance Company O) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Boys & Girls Clubs of the Midlands', 'Healthcare', '120-220', '170 employees. Score: 73/100 (high). New broker (Silverstone Asset Management) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Helget Gas Products, Inc', 'Wholesale Trade', '124-224', '174 employees. Score: 73/100 (high). New broker (John Hancock Life Insurance Company) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Hugo Enterprises, LLC', 'Professional Services', '137-237', '187 employees. Score: 73/100 (high). New broker (Paychex) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('First Insurance Group, LLC', 'Financial Services', '147-247', '197 employees. Score: 73/100 (high). New broker (Prime Capital Investment) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Lamp Rynearson, Inc', 'Professional Services', '156-256', '206 employees. Score: 72/100 (high). New broker (The Benecon Group) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Union Pacific Railroad Company', 'Transportation', '184-284', '234 employees. Score: 72/100 (high). New broker (Vanguard Advisers Inc.) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Automatic Equipment Manufacturing CO', 'Manufacturing', '187-287', '237 employees. Score: 72/100 (high). New broker (Security National Bank) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Corporate Travel Management, Inc', 'Administrative Services', '203-303', '253 employees. Score: 71/100 (high). New broker (Creative Planning Holdco LLC) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Mcgrath North Mullin & Kratz, Pc Llo', 'Professional Services', '85-185', '135 employees. Score: 70/100 (high). New broker (Usi Advisors INC) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Metropolitan Entertainment & Convention Authority', 'Arts & Entertainment', '86-186', '136 employees. Score: 70/100 (high). New broker (Ascensus LLC) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Habitat for Humanity of Omaha INC', 'Healthcare', '98-198', '148 employees. Score: 70/100 (high). New broker (Creative Planning) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Total Respiratory & Rehab INC', 'Healthcare', '155-255', '205 employees. Score: 70/100 (high). New broker (Paychex) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Client Server Software Solutions, Inc Dba Constellation West', 'Professional Services', '178-278', '228 employees. Score: 70/100 (high). New broker (Signature Estate & Invest Advs LLC) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Cancer Partners of Nebraska, P.c.', 'Healthcare', '187-287', '237 employees. Score: 70/100 (high). New broker (Merrill Lynch) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Vital Healthcare Staffing Inc', 'Administrative Services', '197-297', '247 employees. Score: 70/100 (high). New broker (Adp) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Charles Drew Health Center, Inc', 'Healthcare', '175-275', '225 employees. Score: 69/100 (high). New broker (Evergreen Capital Management) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Viterra Usa, LLC', 'Manufacturing', '177-277', '227 employees. Score: 69/100 (high). New broker (Stancorp Financial Group) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Ultimate Motorcars INC', 'Retail Trade', '182-282', '232 employees. Score: 69/100 (high). New broker (The Benefit Group) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Ford Storage and Moving Company', 'Transportation', '197-297', '247 employees. Score: 69/100 (high). New broker (The Benefit Group) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Omaha Brotherhood of Electrical Workers Local No. 22 Vacation-', 'Construction', '1897-1997', '1947 employees. Score: 68/100 (high). New broker (Deboer & Associates) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Board of Trustees Steamfitters Local Union No. 464', 'Construction', '1725-1825', '1775 employees. Score: 68/100 (high). New broker (First National Bank) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Omaha Const. Ind. Pension Plan Joint Board of Trustees', 'Construction', '1352-1452', '1402 employees. Score: 68/100 (high). New broker (Segal Marco Advisors) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Board of Trustees Steamfitters and Plumbers Local Union No 464 Vacatio', 'Construction', '1317-1417', '1367 employees. Score: 68/100 (high). New broker (Odonnell) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Transwood, Inc', 'Transportation', '1163-1263', '1213 employees. Score: 68/100 (high). New broker (The Vanguard Group) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Sapp Bros., Inc', 'Retail Trade', '1065-1165', '1115 employees. Score: 68/100 (high). New broker (Usi Advisors INC) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Heritage Hr, LLC', 'Healthcare', '992-1092', '1042 employees. Score: 68/100 (high). New broker (Newport Group) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Sid Dillon Chevrolet-fremont, Inc', 'Retail Trade', '776-876', '826 employees. Score: 68/100 (high). New broker (Capital Research and Management) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Hawkins Construction Company', 'Construction', '628-728', '678 employees. Score: 68/100 (high). New broker (Ascensus) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Election Systems & Software, LLC', 'Manufacturing', '602-702', '652 employees. Score: 68/100 (high). New broker (Fidelity Investments Institutional) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Board of Trustees of Plumbers Local Union No. 16 Vacation Trust Fund', 'Construction', '539-639', '589 employees. Score: 68/100 (high). New broker (Lutz & Company Pc) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Risemark Holdings, LLC', 'Healthcare', '101-201', '151 employees. Score: 68/100 (high). New broker (Principal Securities INC) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Rd Industries, Inc', 'Manufacturing', '105-205', '155 employees. Score: 68/100 (high). New broker (Wilshire Advisors) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('L. G. Roloff Construction Co., Inc', 'Construction', '107-207', '157 employees. Score: 68/100 (high). New broker (Creative Planning) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Browns Medical Imaging, LLC', 'Healthcare', '110-210', '160 employees. Score: 68/100 (high). New broker (D a Davidson and CO) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('United Way of the Midlands', 'Nonprofit', '122-222', '172 employees. Score: 68/100 (high). New broker (Futureplan By Ascensus) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Makovicka-harms Group, P.c.', 'Healthcare', '131-231', '181 employees. Score: 68/100 (high). New broker (Futureplan By Ascensus) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Trustees of the Insulators & Allied Workers Health and Welfare Plan', 'Financial Services', '139-239', '189 employees. Score: 68/100 (high). New broker (Vanguard Fiduciary Services) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Radio Engineering Industries, Inc', 'Manufacturing', '145-245', '195 employees. Score: 68/100 (high). New broker (Fidelity Investments Institutional) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Ho-chunk, Inc', 'Management', '205-305', '255 employees. Score: 68/100 (high). New broker (Stancorp Financial Group) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Advanced Motorcars, Inc Dba Acura of Omaha', 'Retail Trade', '219-319', '269 employees. Score: 68/100 (high). New broker (Creative Planning) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Lauritzen Corporation', 'Financial Services', '306-406', '356 employees. Score: 68/100 (high). New broker (Voya Institutional Plan Services) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Blue Cross and Blue Shield of Nebraska', 'Financial Services', '318-418', '368 employees. Score: 68/100 (high). New broker (Aon Consulting) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Quality Pork International Inc', 'Manufacturing', '381-481', '431 employees. Score: 68/100 (high). New broker (Newport Group) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Aoi Corporation', 'Construction', '87-187', '137 employees. Score: 67/100 (high). New broker (Mutual of Omaha Investor Services) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('M.e. Collins Contracting', 'Construction', '91-191', '141 employees. Score: 67/100 (high). New broker (Principal Securities INC) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Engineered Controls Inc', 'Professional Services', '91-191', '141 employees. Score: 67/100 (high). New broker (John Hancock Life Insurance Company) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Omni Behavioral Health', 'Healthcare', '97-197', '147 employees. Score: 67/100 (high). New broker (Principal Securities INC) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Midwest Surgical Hospital, LLC', 'Healthcare', '99-199', '149 employees. Score: 67/100 (high). New broker (Wealth Plan Investment Management) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Capstone It INC', 'Professional Services', '118-218', '168 employees. Score: 66/100 (high). New broker (Paychex) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Thrift Holdings, LLC', 'Retail Trade', '121-221', '171 employees. Score: 66/100 (high). New broker (Adp) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Frontier Holdings, LLC', 'Financial Services', '122-222', '172 employees. Score: 66/100 (high). New broker (July Business Services LLC) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Calvert Systems Engineering, Inc', 'Professional Services', '136-236', '186 employees. Score: 66/100 (high). New broker (Avior Wealth Management) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Marketsphere Holdings, LLC', 'Professional Services', '142-242', '192 employees. Score: 66/100 (high). New broker (Bridges Investment Management) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('A.c. Nelsen Enterprises, Inc', 'Retail Trade', '116-216', '166 employees. Score: 65/100 (high). New broker (North American Ktrade Alliance) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Woodmen of the World Life Insurance Society', 'Financial Services', '147-247', '197 employees. Score: 65/100 (high). New broker (Empower Annuity Insurance Company O) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Bosselman Energy, Inc', 'Wholesale Trade', '174-274', '224 employees. Score: 65/100 (high). New broker (Usi Advisors INC) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Nye Health Services', 'Healthcare', '434-534', '484 employees. Score: 64/100 (high). New broker (Gallagher Benefit Services) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Justice for Our Neighbors-', 'Nonprofit', '70-170', '120 employees. Score: 62/100 (high). New broker (Mutual of America Sec. CORP LLC) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Metro Cu Federal Credit Union', 'Financial Services', '88-188', '138 employees. Score: 62/100 (high). New broker (Convergence Wealth LLC) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('A-1 United Heating, Air and Electrical Co., Inc', 'Manufacturing', '98-198', '148 employees. Score: 62/100 (high). New broker (Usi Advisors INC) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Nebraska Organ Recovery System D/b/a Live on Nebraska', 'Healthcare', '152-252', '202 employees. Score: 62/100 (high). New broker (Vestwell) — may be open to switch', 'Form 5500 / DOL'),
  makeProspect('Reefer Systems, Inc Dba Midland', 'Other Services', '155-255', '205 employees. Score: 62/100 (high). New broker (Creative Planning Holdco) — may be open to switch', 'Form 5500 / DOL'),
];

function saveToStorage(state: { active: Prospect[]; researched: Prospect[]; pool: Prospect[] }) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ active: state.active, researched: state.researched, pool: state.pool }),
    );
  } catch {
    // localStorage may be full or unavailable
  }
}

function loadFromStorage(): { active: Prospect[]; researched: Prospect[]; pool: Prospect[] } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed.active) && Array.isArray(parsed.pool)) {
      return parsed;
    }
  } catch {
    // corrupted data
  }
  return null;
}

export const useProspectStore = create<ProspectState>((set, get) => ({
  active: [],
  researched: [],
  pool: [],

  initProspects: () => {
    // v2: force reload with real DOL data (clear old mock cache)
    const VERSION_KEY = 'dcc_prospects_v';
    const CURRENT_VERSION = '2';
    const savedVersion = localStorage.getItem(VERSION_KEY);

    if (savedVersion === CURRENT_VERSION) {
      const saved = loadFromStorage();
      if (saved && saved.active.length > 0) {
        set({ active: saved.active, researched: saved.researched ?? [], pool: saved.pool });
        return;
      }
    }

    // Clear old data and reload
    localStorage.removeItem(STORAGE_KEY);
    localStorage.setItem(VERSION_KEY, CURRENT_VERSION);
    // First time or reset: take 5 from the built-in pool
    const allProspects = [...BUILT_IN_POOL];
    const active = allProspects.slice(0, 5).map((p) => ({ ...p, status: 'active' as const }));
    const pool = allProspects.slice(5);
    set({ active, researched: [], pool });
    saveToStorage({ active, researched: [], pool });
  },

  markResearched: (id: string) => {
    const { active, researched, pool } = get();
    const prospect = active.find((p) => p.id === id);
    if (!prospect) return;

    const newResearched = [...researched, { ...prospect, status: 'researched' as const }];
    const newActive = active.filter((p) => p.id !== id);

    if (pool.length > 0) {
      const next = { ...pool[0], status: 'active' as const };
      newActive.push(next);
      const newPool = pool.slice(1);
      set({ active: newActive, researched: newResearched, pool: newPool });
      saveToStorage({ active: newActive, researched: newResearched, pool: newPool });
    } else {
      set({ active: newActive, researched: newResearched });
      saveToStorage({ active: newActive, researched: newResearched, pool: [] });
    }
  },

  dismissProspect: (id: string) => {
    const { active, researched, pool } = get();
    const newActive = active.filter((p) => p.id !== id);

    if (pool.length > 0) {
      const next = { ...pool[0], status: 'active' as const };
      newActive.push(next);
      const newPool = pool.slice(1);
      set({ active: newActive, pool: newPool });
      saveToStorage({ active: newActive, researched, pool: newPool });
    } else {
      set({ active: newActive });
      saveToStorage({ active: newActive, researched, pool: [] });
    }
  },
}));
