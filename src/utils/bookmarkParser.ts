import { Group, Site, ExportData } from '../API/http';

/**
 * Split a large group into multiple smaller groups if site count exceeds limit
 * @param groupName Original group name
 * @param sites List of sites in the group
 * @param maxSitesPerGroup Maximum sites per group (default 50)
 */
function splitGroup(groupName: string, sites: Partial<Site>[], maxSitesPerGroup = 50): { group: Partial<Group>, sites: Partial<Site>[] }[] {
    if (sites.length <= maxSitesPerGroup) {
        return [{
            group: { name: groupName, order_num: 0 },
            sites: sites
        }];
    }

    const result = [];
    const totalParts = Math.ceil(sites.length / maxSitesPerGroup);

    for (let i = 0; i < totalParts; i++) {
        const start = i * maxSitesPerGroup;
        const end = start + maxSitesPerGroup;
        const chunkSites = sites.slice(start, end);

        result.push({
            group: {
                name: i === 0 ? groupName : `${groupName} (${i + 1})`,
                order_num: 0
            },
            sites: chunkSites
        });
    }

    return result;
}

/**
 * Parse browser bookmarks HTML content
 * @param htmlContent The HTML content of the bookmarks file
 * @returns Formatted data ready for import
 */
export function parseBookmarksHtml(htmlContent: string): ExportData {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');

    const result: ExportData = {
        groups: [],
        sites: [],
        configs: {},
        version: '1.0',
        exportDate: new Date().toISOString(),
    };

    // Find all DT elements that contain H3 (folder) and DL (content)
    // This is a simplified approach. Standard bookmarks format is DL > DT > H3 + DL

    // We will traverse the DOM manually to handle nesting or flat listing
    // For simplicity, we only extract top-level folders or direct links in "Bookmarks Bar"

    // Helper to extract sites from a DL list
    const extractSites = (dlElement: Element): Partial<Site>[] => {
        const sites: Partial<Site>[] = [];
        const links = dlElement.querySelectorAll('a');

        links.forEach((link, index) => {
            sites.push({
                name: link.textContent || 'Unknown Site',
                url: link.getAttribute('href') || '',
                icon: link.getAttribute('icon') || '',
                order_num: index,
            });
        });

        return sites;
    };

    // 1. Try to find the "Bookmarks Bar" or equivalent main folder
    const mainDl = doc.querySelector('dl');

    if (!mainDl) {
        throw new Error('Invalid bookmarks file format');
    }

    // Iterate over children of main DL
    // In Netscape Bookmark format:
    // <DT><H3>Folder Name</H3>
    // <DL><p> ... items ... </DL><p>

    let currentOrder = 0;

    // Convert NodeList to Array for easier handling
    const dtElements = Array.from(mainDl.children).filter(el => el.tagName === 'DT');

    // Collection of all sites properly grouped
    const groupedSites: { groupName: string, sites: Partial<Site>[] }[] = [];

    // Also collect loose sites (not in any folder)
    const looseSites: Partial<Site>[] = [];

    // Recursive function to process nodes
    // But we stick to 1-level depth first (folders in root) to map to our Groups

    for (const dt of dtElements) {
        const header = dt.querySelector('h3');
        const childDl = dt.querySelector('dl');
        const link = dt.querySelector('a');

        if (header && childDl) {
            // It's a folder
            const folderName = header.textContent || 'Untitled Folder';
            const sites = extractSites(childDl);

            if (sites.length > 0) {
                groupedSites.push({ groupName: folderName, sites });
            }
        } else if (link) {
            // It's a loose link in the root
            looseSites.push({
                name: link.textContent || 'Unknown Site',
                url: link.getAttribute('href') || '',
                icon: link.getAttribute('icon') || '',
                order_num: 0, // will assign later
            });
        }
    }

    // If we have loose sites, add them to a "General" group
    if (looseSites.length > 0) {
        groupedSites.unshift({ groupName: '未分类书签', sites: looseSites });
    }

    // Convert to our ExportData format
    // We need to assign temporary IDs to groups to link sites

    let groupCounter = 1;
    const processedGroups: any[] = [];
    const processedSites: any[] = [];

    groupedSites.forEach((item, index) => {
        // Check if we need to split the group
        const chunks = splitGroup(item.groupName, item.sites);

        chunks.forEach((chunk) => {
            const groupId = groupCounter++;

            processedGroups.push({
                id: groupId, // Temp ID, will be ignored by backend usually or handled
                name: chunk.group.name,
                order_num: index * 10, // Space them out
            });

            chunk.sites.forEach((site, sIndex) => {
                processedSites.push({
                    ...site,
                    group_id: groupId,
                    order_num: sIndex,
                });
            });
        });
    });

    result.groups = processedGroups;
    result.sites = processedSites;

    return result;
}
