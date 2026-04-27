db = db.getSiblingDB('treegens')

db.createUser({
  user: 'treegens',
  pwd: 'treegens123',
  roles: [
    {
      role: 'readWrite',
      db: 'treegens',
    },
  ],
})

db.submissions.createIndex({ userWalletAddress: 1, createdAt: -1 })
db.submissions.createIndex({ status: 1, updatedAt: -1 })
db.submissions.createIndex({ 'votes.voterWalletAddress': 1 })
db.submissions.createIndex(
  { 'land.videoCID': 1 },
  { unique: true, sparse: true },
)
db.submissions.createIndex(
  { 'plant.videoCID': 1 },
  { unique: true, sparse: true },
)

print('Database initialized successfully')
