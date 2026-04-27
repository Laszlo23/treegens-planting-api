/** Shared copy for /tutorial and /tutorial/verify (mirrors mobile tutorial screens). */
import type { ReactNode } from 'react'

export const plantTitle = {
  English: 'How to Plant Mangroves',
  Swahili: 'Jinsi ya Kupanda Mikoko',
}

export const verifyTitle = {
  English: 'How to Verify Your Mangrove Plantation',
  Swahili: 'Jinsi ya Kuthibitisha Shamba Lako la Mikoko',
}

export const plantInstructions: Record<'English' | 'Swahili', ReactNode> = {
  English: (
    <div className="flex flex-col gap-2 ">
      <div className="flex flex-col gap-2">
        <h3>
          <span className="font-bold">Step 1{`)`}</span> Find propagules (long
          stick-like seeds){' '}
        </h3>
        <ol className="list-[disc] pl-8">
          <li>
            If{' '}
            <a
              className="text-tree-green-3 font-bold underline"
              href="https://en.m.wikipedia.org/wiki/Ceriops_australis"
              target="_blank"
            >
              Ceriops
            </a>{' '}
            species, there should be 2-3 cms of yellow at the top of them to be
            ripe enough to pluck from the trees
          </li>
          <li>
            Can also find on the ground, as long as they are not dark brown /
            black from sun damage, they are ok to plant{' '}
          </li>
          <li>
            If
            <a
              className="text-tree-green-3 font-bold underline"
              href="https://en.m.wikipedia.org/wiki/Rhizophora"
              target="_blank"
            >
              {' '}
              Rhizophora
            </a>{' '}
            they must be long enough to be ripe, typically around 20-60cm
          </li>
          <li>
            If another species, contact a specialist in our{' '}
            <a
              className="text-tree-green-3 font-bold underline"
              href="http://t.me/TreegenFam"
              target="_blank"
            >
              {' '}
              Telegram
            </a>{' '}
          </li>
        </ol>
      </div>
      <div className="flex flex-col gap-2">
        <h3>
          <span className="font-bold">Step 2{`)`}</span> Plant each propagule
          about 30cms apart if planting directly. If you are planting mangrove
          seedlings from a nursery, plant them 1 metre apart.
        </h3>
      </div>
      <div className="flex flex-col gap-2">
        <h3>
          <span className="font-bold">Step 3{`)`}</span> Only plant the mangrove
          propagules within 2 metres of the same tree species.
        </h3>
      </div>
    </div>
  ),
  Swahili: (
    <div className="flex flex-col gap-2 ">
      <div className="flex flex-col gap-2">
        <h3>
          <span className="font-bold">Hatua ya 1{')'}</span> Tafuta mbegu za
          mikoko (mbegu zinazofanana na vijiti virefu)
        </h3>
        <ol className="list-[disc] pl-8">
          <li>
            Ikiwa ni spishi ya{' '}
            <a
              className="text-tree-green-3 font-bold underline"
              href="https://en.m.wikipedia.org/wiki/Ceriops_australis"
              target="_blank"
            >
              Ceriops
            </a>{' '}
            , zinapaswa kuwa na sehemu ya juu yenye urefu wa sentimita 2-3 ya
            rangi ya njano ili kuwa tayari kuchunwa kutoka kwenye miti.
          </li>
          <li>
            Pia unaweza kuzipata ardhini, mradi hazijakua na rangi ya
            kahawia/dhahabu nyeusi kutokana na kuharibiwa na jua.
          </li>
          <li>
            Ikiwa ni{' '}
            <a
              className="text-tree-green-3 font-bold underline"
              href="https://en.m.wikipedia.org/wiki/Rhizophora"
              target="_blank"
            >
              {' '}
              Rhizophora
            </a>
            , lazima ziwe na urefu wa kutosha kuonyesha ukomavu, kawaida ya
            urefu wa sentimita 20-60.
          </li>
          <li>
            Ikiwa ni spishi nyingine, wasiliana na mtaalamu kupitia{' '}
            <a
              className="text-tree-green-3 font-bold underline"
              href="http://t.me/TreegenFam"
              target="_blank"
            >
              {' '}
              Telegram
            </a>{' '}
            yetu.
          </li>
        </ol>
      </div>
      <div className="flex flex-col gap-2">
        <h3>
          <span className="font-bold">Hatua ya 2{')'}</span> Panda kila mbegu
          kwa umbali wa takriban sentimita 30 kutoka kwa mbegu nyingine ikiwa
          unazipanda moja kwa moja. Ikiwa unapanda miche ya mikoko kutoka kwenye
          bustani ya miche, panda kwa umbali wa mita 1 kutoka kwa mbengu
          nyingine.
        </h3>
      </div>
      <div className="flex flex-col gap-2">
        <h3>
          <span className="font-bold">Hatua ya 3{')'}</span> Panda mbegu za
          mikoko mita 2 kutoka kwa mti wa spishi hiyo hiyo.
        </h3>
      </div>
    </div>
  ),
}

export const verifyInstructions: Record<'English' | 'Swahili', ReactNode> = {
  English: (
    <div className="flex flex-col gap-2 ">
      <div className="flex flex-col gap-2">
        <h3>
          <span className="font-bold">Step 1{`)`}</span> Before planting, film
          the land you will be planting.
        </h3>
      </div>
      <div className="flex flex-col gap-2">
        <h3>
          <span className="font-bold">Step 2{`)`}</span> After planting, film
          the propagules planted in one continuous direction e.g. from left to
          right or up to down. Do not go left right and then left again, for
          example. If you mangrove propagule goes out of the screen & then back
          in, it will be counted twice & you will need to film the trees again.
        </h3>
      </div>
      <div className="flex flex-col gap-2">
        <h3>
          <span className="font-bold">Step 3{`)`}</span> Wait for DAO verifiers
          to verify your planting methodology to issue your $MGRO tokens. 1/6th
          of an $MGRO token will be sent to you when you first plant. Another
          1/6th will be sent every 6 months, over the course of 3 years so you
          are incentivised to do health checks on your mangroves.
        </h3>
      </div>
    </div>
  ),
  Swahili: (
    <div className="flex flex-col gap-2 ">
      <div className="flex flex-col gap-2">
        <h3>
          <span className="font-bold">Hatua ya 1{')'}</span> Kabla ya kupanda,
          chukua video ya eneo utakalopanda.
        </h3>
      </div>
      <div className="flex flex-col gap-2">
        <h3>
          <span className="font-bold">Hatua ya 2{')'}</span> Baada ya kupanda,
          chukua video ya mbegu ulizopanda kwa mwelekeo mmoja, mfano kutoka
          kushoto kwenda kulia au kutoka juu kwenda chini. Kwa mfano, usirudi
          kushoto, kisha kulia na kisha kushoto tena. Ikiwa mbegu ya mikoko
          itatoka nje ya skrini na kisha kurudi, itahesabiwa mara mbili na
          utahitaji kupiga video ya miti tena.
        </h3>
      </div>
      <div className="flex flex-col gap-2">
        <h3>
          <span className="font-bold">Hatua ya 3{')'}</span>Subiri wahakiki wa
          DAO kuthibitisha mbinu yako ya upandaji ili upewe tokeni zako za
          $MGRO. Sehemu ya 1/6 ya tokeni ya $MGRO itatumwa kwako unapoanza
          kupanda. Sehemu nyingine ya 1/6 itatumwa kila baada ya miezi 6, kwa
          muda wa miaka 3 ili uwe na motisha ya kufanya ukaguzi wa afya ya
          mikoko yako.
        </h3>
      </div>
    </div>
  ),
}
