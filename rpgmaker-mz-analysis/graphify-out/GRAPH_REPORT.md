# Graph Report - v1.1.0  (2026-11-22)

## Corpus Check
- 7 files · ~50,000 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 3607 nodes · 7674 edges · 162 communities (7 shown, 155 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 48 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Module_0
- Module_1
- Module_2
- Module_3
- Module_4
- Module_5
- Module_6
- Module_7
- Module_8
- Module_9
- Module_10
- Module_11
- Module_12
- Module_13
- Module_14
- Module_15
- Module_16
- Module_17
- Module_18
- Module_19
- Module_20
- Module_21
- Module_22
- Module_23
- Module_24
- Module_25
- Module_26
- Module_27
- Module_28
- Module_29
- Module_30
- Module_31
- Module_32
- Module_33
- Module_34
- Module_35
- Module_36
- Module_37
- Module_38
- Module_39
- Module_40
- Module_41
- Module_42
- Module_45
- Module_46
- Module_47
- Module_48
- Module_49
- Module_50
- Module_52
- Module_53
- Module_54
- Module_55
- Module_56
- Module_58
- Module_59
- Module_60
- Module_61
- Module_62
- Module_65
- Module_66
- Module_67
- Module_69
- Module_70
- Module_71
- Module_72
- Module_73
- Module_74
- Module_76
- Module_77
- Module_78
- Module_79
- Module_81
- Module_82
- Module_83
- Module_84
- Module_85
- Module_87
- Module_88
- Module_89
- Module_90
- Module_91
- Module_93
- Module_95
- Module_97
- Module_98
- Module_101
- Module_102
- Module_103
- Module_105
- Module_106
- Module_107
- Module_108
- Module_112
- Module_113
- Module_114
- Module_115
- Module_119
- Module_120
- Module_123
- Module_127
- Module_128
- Module_130
- Module_131
- Module_132
- Module_134
- Module_135
- Module_136
- Module_140
- Module_141
- Module_142
- Module_143
- Module_144
- Module_149

## God Nodes (most connected - your core abstractions)
1. `Game_Interpreter()` - 159 edges
2. `Game_Actor()` - 134 edges
3. `Game_BattlerBase()` - 128 edges
4. `Game_Battler()` - 122 edges
5. `Game_Map()` - 112 edges
6. `Game_Action()` - 111 edges
7. `Game_CharacterBase()` - 96 edges
8. `Window_Selectable()` - 89 edges
9. `Scene_Battle()` - 83 edges
10. `Window_BattleLog()` - 78 edges

## Surprising Connections (you probably didn't know these)
- None detected - all connections are within the same source files.

## Import Cycles
- None detected.

## Communities (162 total, 155 thin omitted)

### Community 7 - "Module_7"
Cohesion: 0.06
Nodes (3): Window_EquipItem(), Window_Scrollable(), Window_SkillList()

### Community 22 - "Module_22"
Cohesion: 0.08
Nodes (3): Scene_File(), Scene_Load(), Scene_Save()

### Community 25 - "Module_25"
Cohesion: 0.09
Nodes (4): Main, main, scriptUrls, Scene_Boot()

### Community 30 - "Module_30"
Cohesion: 0.07
Nodes (8): Window_EquipCommand(), Window_GameEnd(), Window_HorzCommand(), Window_PartyCommand(), Window_ShopCommand(), Window_ShopSell(), Window_SkillStatus(), Window_StatusEquip()

### Community 32 - "Module_32"
Cohesion: 0.09
Nodes (5): Point(), Rectangle(), Stage(), TilingSprite(), WindowLayer()

### Community 34 - "Module_34"
Cohesion: 0.08
Nodes (3): Scene_GameEnd(), Scene_Menu(), Scene_Options()

### Community 84 - "Module_84"
Cohesion: 0.17
Nodes (3): Window_BattleItem(), Window_BattleSkill(), Window_TitleCommand()

## Knowledge Gaps
- **155 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Game_Interpreter()` connect `Module_8` to `Module_129`, `Module_2`, `Module_98`, `Module_68`, `Module_99`, `Module_3`, `Module_34`, `Module_26`, `Module_44`, `Module_17`, `Module_147`, `Module_52`, `Module_22`, `Module_23`, `Module_122`, `Module_123`, `Module_62`?**
  _High betweenness centrality (0.127) - this node is a cross-community bridge._
- **Should `Module_0` be split into smaller, more focused modules?**
  _Cohesion score 0.054664080409098925 - nodes in this community are weakly interconnected._
- **Why does `Game_Actor()` connect `Module_16` to `Module_1`, `Module_2`, `Module_98`, `Module_104`, `Module_137`, `Module_138`, `Module_43`, `Module_109`, `Module_51`, `Module_116`, `Module_117`, `Module_149`, `Module_92`, `Module_94`, `Module_95`?**
  _High betweenness centrality (0.060) - this node is a cross-community bridge._
- **Should `Module_1` be split into smaller, more focused modules?**
  _Cohesion score 0.03135964912280702 - nodes in this community are weakly interconnected._
- **Why does `Window_StatusBase()` connect `Module_31` to `Module_38`, `Module_83`, `Module_148`, `Module_30`?**
  _High betweenness centrality (0.060) - this node is a cross-community bridge._
- **Should `Module_2` be split into smaller, more focused modules?**
  _Cohesion score 0.04908160192713038 - nodes in this community are weakly interconnected._
- **Should `Module_3` be split into smaller, more focused modules?**
  _Cohesion score 0.05516475379489078 - nodes in this community are weakly interconnected._