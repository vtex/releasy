const addChangelogVersionLinks = (config, changelogContent) => {
  let updatedChangelog = changelogContent

  const [org, repo] = config.githubInfo

  const unreleasedUrl = `https://github.com/${org}/${repo}/compare/${config.tagName}...HEAD`
  const unreleasedLink = `[Unreleased]: ${unreleasedUrl}`

  if (changelogContent.includes('[Unreleased]:')) {
    updatedChangelog = updatedChangelog.replace(
      /\[Unreleased\]:.*HEAD/,
      unreleasedLink
    )
  } else {
    updatedChangelog = `${updatedChangelog}\n\n${unreleasedLink}`
  }

  const currentVersionLink = `[${config.currentVersion}]:`
  const releaseUrl = `https://github.com/${org}/${repo}/compare/${config.currentVersionTagName}...${config.tagName}`
  const releaseLink = `[${config.newVersion}]: ${releaseUrl}`

  if (updatedChangelog.includes(currentVersionLink)) {
    return updatedChangelog.replace(
      currentVersionLink,
      `${releaseLink}\n${currentVersionLink}`
    )
  }

  return `${updatedChangelog}\n${releaseLink}`
}

module.exports = {
  addChangelogVersionLinks,
}
